import { Names, Resource, ResourceProps, Stack, Token } from 'aws-cdk-lib';
import { FlowLogDestination } from 'aws-cdk-lib/aws-ec2';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { IConstruct } from 'constructs';
import { FourTierNetworkHub, IpAddressManager } from '.';
import { FourTierNetworkSpoke } from './four-tier-network-spoke';
import { FlowLogFormat, ITransitGatewayRouteTable } from '../ec2';
import { GlobalNetwork } from '../networkmanager/global-network';
import { FlowLogsBucket } from '../s3-buckets';


export interface NetworkControllerProps extends ResourceProps {
  readonly defaultNetmask?: number;
  readonly flowLogBucket?: IBucket;
  readonly flowLogFormat?: FlowLogFormat;
}

export interface AddNetworkOptions {
  readonly availabilityZones?: string[];
  readonly maxAzs?: number;
  readonly netmask?: number;
}

export interface AddHubOptions extends AddNetworkOptions {
  readonly defaultTransitGatewayRouteTable?: ITransitGatewayRouteTable;
}

export class NetworkController extends Resource {
  // Internal properties
  private readonly _hubs: { [region: string]: FourTierNetworkHub };
  private readonly _registeredAccounts: Set<string>;
  private readonly _registeredRegions: Set<string>;

  // Input properties
  public readonly defaultNetmask: number;
  public readonly flowLogFormat: FlowLogFormat;

  // Resource properties
  public readonly addressManager: IpAddressManager;
  public readonly flowLogBucket: IBucket;
  public readonly globalNetwork: GlobalNetwork;

  // Standard propertioes
  public get registeredAccounts(): string[] {
    return Array.from(this._registeredAccounts);
  }

  public get registeredRegions(): string[] {
    return Array.from(this._registeredRegions);
  }


  public constructor(scope: IConstruct, id: string, props: NetworkControllerProps = {}) {
    super(scope, id);

    if (Token.isUnresolved(this.stack.account) || Token.isUnresolved(this.stack.region)) {
      throw new Error([
        'A network controller can only be deployed using a stack with a fully',
        'qualified environment.',
      ].join(' '));
    }

    this._hubs = {};
    this._registeredAccounts = new Set<string>();
    this._registeredRegions = new Set<string>();

    this.defaultNetmask = props.defaultNetmask ?? 16;
    this.flowLogFormat = props.flowLogFormat ?? FlowLogFormat.V5;

    this.addressManager = new IpAddressManager(this, 'address-manager');
    this.globalNetwork = new GlobalNetwork(this, 'global-network');
    this.flowLogBucket = props.flowLogBucket ?? new FlowLogsBucket(this, 'flow-log-bucket', {
      bucketName: Names.uniqueId(this).toLowerCase(),
      format: this.flowLogFormat,
    });
  }

  public addHub(scope: IConstruct, id: string, options: AddHubOptions = {}): FourTierNetworkHub {
    const scopeStack = Stack.of(scope);
    const scopeAccount = scopeStack.account;
    const scopeRegion = scopeStack.region;

    if (Token.isUnresolved(scopeAccount) || Token.isUnresolved(scopeRegion)) {
      throw new Error([
        'To add a hub network please provide a scope that belongs to a stack',
        'with a fully qualified environment.',
      ].join(' '));
    } else if (scopeRegion in this._hubs) {
      throw new Error([
        `A hub network already exists for the region '${scopeRegion}'.`,
      ].join(' '));
    }

    this.registerAccount(scopeAccount);
    this.registerRegion(scopeRegion);

    const netmask = options.netmask ?? this.defaultNetmask;
    const provider = this.addressManager.getVpcConfiguration(scope, id, {
      netmask: netmask,
    });

    const hub = new FourTierNetworkHub(scope, id, {
      availabilityZones: options.availabilityZones,
      cidr: provider,
      defaultTransitGatewayRouteTable: options.defaultTransitGatewayRouteTable,
      flowLogs: {
        'flow-log-default': {
          destination: FlowLogDestination.toS3(this.flowLogBucket),
          logFormatDefinition: this.flowLogFormat,
        },
      },
      maxAzs: options.maxAzs,

    });
    this._hubs[scopeRegion] = hub;
    return hub;
  }

  public addSpoke(scope: IConstruct, id: string, options: AddNetworkOptions = {}): FourTierNetworkSpoke {
    const scopeStack = Stack.of(scope);
    const scopeAccount = scopeStack.account;
    const scopeRegion = scopeStack.region;
    const hub = this._hubs[scopeRegion];

    if (Token.isUnresolved(scopeAccount) || Token.isUnresolved(scopeRegion)) {
      throw new Error([
        'To add a spoke network please provide a scope that belongs to a',
        'stack with a fully qualified environment.',
      ].join(' '));
    } else if (hub == undefined) {
      throw new Error([
        `A hub network must be registered for the '${scopeRegion}' before a`,
        'spoke can be added for that region.',
      ].join(' '));
    }

    this.registerAccount(scopeAccount);
    this.registerRegion(scopeRegion);

    const netmask = options.netmask ?? this.defaultNetmask;
    const provider = this.addressManager.getVpcConfiguration(scope, `${id}-${scope.node.addr}`, {
      netmask: netmask,
    });

    return hub.addSpoke(scope, id, {
      availabilityZones: options.availabilityZones,
      cidr: provider,
      flowLogs: {
        'flow-log-default': {
          destination: FlowLogDestination.toS3(this.flowLogBucket),
          logFormatDefinition: this.flowLogFormat,
        },
      },
      maxAzs: options.maxAzs,
    });
  }

  public registerCidr(scope: IConstruct, id: string, cidr: string): void {
    this.addressManager.registerCidr(scope, id, cidr);
  }

  protected registerAccount(account: string): void {
    if (account === this.stack.account) {
      return;
    } else if (this.registeredAccounts.includes(account)) {
      return;
    } else if (Token.isUnresolved(account)) {
      throw new Error([
        'Accounts registered with a network controller cannot contain tokens',
      ].join(' '));
    }

    this._registeredAccounts.add(account);
  }

  protected registerRegion(region: string): void {
    if (region === this.stack.region) {
      return;
    } else if (this.registeredRegions.includes(region)) {
      return;
    } else if (Token.isUnresolved(region)) {
      throw new Error([
        'Regions registered with a network controller cannot contain tokens',
      ].join(' '));
    }

    this._registeredRegions.add(region);
  }
}
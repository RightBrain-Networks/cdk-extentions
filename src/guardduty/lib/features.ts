import { DataSource, IDataSource } from './data-source';


/**
 * Additional configuration of the feature.
 *
 * @see [FeatureConfigurations AdditionalConfiguration](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-guardduty-detector-featureconfigurations.html#cfn-guardduty-detector-featureconfigurations-additionalconfiguration)
 */
export interface IFeatureSetting {
  /**
   * Status of the additional configuration of a feature.
   *
   * @see [FeatureAdditionalConfiguration Status](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-guardduty-detector-featureadditionalconfiguration.html#cfn-guardduty-detector-featureadditionalconfiguration-status)
   */
  readonly enabled: boolean;

  /**
   * Name of the additional configuration of a feature.
   *
   * @see [FeatureAdditionalConfiguration Name](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-guardduty-detector-featureadditionalconfiguration.html#cfn-guardduty-detector-featureadditionalconfiguration-name)
   */
  readonly name: string;
}

/**
 * Represents a feature that will be configured for a GuardDuty detector.
 *
 * @see [Detector Features](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-guardduty-detector.html#cfn-guardduty-detector-features)
 * @see [DetectorFeatureConfiguration](https://docs.aws.amazon.com/guardduty/latest/APIReference/API_DetectorFeatureConfiguration.html)
 */
export interface IFeature {
  /**
   * Provides a data source that must be enabled for the feature to function.
   *
   * @see [Detector DataSources](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-guardduty-detector.html#cfn-guardduty-detector-datasources)
   */
  readonly dataSource?: IDataSource;

  /**
   * Whether the feature should be enabled or not.
   *
   * @see [FeatureConfigurations Status](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-guardduty-detector-featureconfigurations.html#cfn-guardduty-detector-featureconfigurations-status)
   */
  readonly enabled: boolean;

  /**
   * Name of the feature.
   *
   * @see [FeatureConfigurations Name](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-guardduty-detector-featureconfigurations.html#cfn-guardduty-detector-featureconfigurations-name)
   */
  readonly name: string;

  /**
   * Additional configuration of the feature.
   *
   * @see [FeatureConfigurations AdditionalConfiguration](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-guardduty-detector-featureconfigurations.html#cfn-guardduty-detector-featureconfigurations-additionalconfiguration)
   */
  readonly settings?: IFeatureSetting[];
}

/**
 * Configuration shared by all GuardDuty detector features.
 */
export interface FeatureOptions {
  /**
   * Whether the feature should be enabled or not.
   *
   * @see [FeatureConfigurations Status](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-guardduty-detector-featureconfigurations.html#cfn-guardduty-detector-featureconfigurations-status)
   */
  readonly enabled?: boolean;
}

/**
 * Configuration for the EKS runtime monitoring GuardDuty detector feature.
 */
export interface EksRuntimeMonitoringOptions extends FeatureOptions {
  /**
   * Determines whether GuardDuty is allowed to manage addons for the EKS
   * cluster.
   *
   * If both runtime monitoring and addon management are enabled GuardDuty can
   * automatically manage the GuardDuty security agent addon that is used to
   * send findings to GuardDuty.
   *
   * If runtime monitoring is enabled and addon management is disabled you must
   * manage the GuardDuty security agent manually.
   *
   * @see [EKS Runtime Monitoring](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty-eks-runtime-monitoring.html)
   * @see [Configuring EKS Runtime Monitoring](https://docs.aws.amazon.com/guardduty/latest/ug/eks-protection-configuration.html)
   */
  readonly addonManagement?: boolean;
}

/**
 * A feature that will be configured for a GuardDuty detector.
 */
export class Feature {
  /**
   * Controls whether GuardDuty should scan the EBS volumes associated with EC2
   * instances for malware and report the results.
   *
   * @see [GuardDuty Malware Protection](https://docs.aws.amazon.com/guardduty/latest/ug/malware-protection.html)
   *
   * @param options Options for configuring the feature.
   * @returns An object representing the configured feature.
   */
  public static ebsMalwareProtection(options: FeatureOptions = {}): IFeature {
    return {
      dataSource: DataSource.malwareProtection(),
      enabled: options.enabled ?? true,
      name: 'EBS_MALWARE_PROTECTION',
    };
  }

  /**
   * Helps you detect potentially suspicious activities in your EKS clusters
   * within Amazon Elastic Kubernetes Service by monitoring the audit logs
   * generated by your clusters.
   *
   * @see [EKS Audit Log Monitoring](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty-eks-audit-log-monitoring.html)
   *
   * @param options Options for configuring the feature.
   * @returns An object representing the configured feature.
   */
  public static eksAuditLogs(options: FeatureOptions = {}): IFeature {
    return {
      dataSource: DataSource.kubernetes(),
      enabled: options.enabled ?? true,
      name: 'EKS_AUDIT_LOGS',
    };
  }

  /**
   * EKS Runtime Monitoring provides runtime threat detection coverage for
   * Amazon Elastic Kubernetes Service (Amazon EKS) nodes and containers within
   * your AWS environment. EKS Runtime Monitoring uses a new GuardDuty security
   * agent that adds runtime visibility into individual EKS workloads, for
   * example, file access, process execution, and network connections.
   *
   * @see [EKS Runtime Monitoring](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty-eks-runtime-monitoring.html)
   *
   * @param options Options for configuring the feature.
   * @returns An object representing the configured feature.
   */
  public static eksRuntimeMonitoring(options: EksRuntimeMonitoringOptions = {}): IFeature {
    return {
      enabled: options.enabled ?? true,
      name: 'EKS_RUNTIME_MONITORING',
      settings: [{
        enabled: options.addonManagement ?? true,
        name: 'EKS_ADDON_MANAGEMENT',
      }],
    };
  }

  /**
   * Lambda Protection helps you identify potential security threats when an
   * AWS Lambda function gets invoked in your AWS environment. When you enable
   * Lambda Protection, GuardDuty starts monitoring Lambda network activity
   * logs, starting with VPC Flow Logs from all Lambda functions for account,
   * including those logs that don't use VPC networking, and are generated when
   * the Lambda function gets invoked.
   *
   * @see [GuardDuty Lambda Protection](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty-eks-runtime-monitoring.html)
   *
   * @param options Options for configuring the feature.
   * @returns An object representing the configured feature.
   */
  public static lambdaNetworkLogs(options: FeatureOptions = {}): IFeature {
    return {
      enabled: options.enabled ?? true,
      name: 'LAMBDA_NETWORK_LOGS',
    };
  }

  /**
   * RDS Protection in Amazon GuardDuty analyzes and profiles RDS login
   * activity for potential access threats to your Amazon Aurora databases
   * (Amazon Aurora MySQL-Compatible Edition and Aurora PostgreSQL-Compatible
   * Edition).
   *
   * @see [GuardDuty RDS Protection](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty-eks-runtime-monitoring.html)
   *
   * @param options Options for configuring the feature.
   * @returns An object representing the configured feature.
   */
  public static rdsLoginEvents(options: FeatureOptions = {}): IFeature {
    return {
      enabled: options.enabled ?? true,
      name: 'RDS_LOGIN_EVENTS',
    };
  }

  /**
   * S3 protection enables Amazon GuardDuty to monitor object-level API
   * operations to identify potential security risks for data within your S3
   * buckets.
   *
   * @see [GuardDuty S3 Protection](https://docs.aws.amazon.com/guardduty/latest/ug/guardduty-eks-runtime-monitoring.html)
   *
   * @param options Options for configuring the feature.
   * @returns An object representing the configured feature.
   */
  public static s3DataEvents(options: FeatureOptions = {}): IFeature {
    return {
      dataSource: DataSource.s3Logs(),
      enabled: options.enabled ?? true,
      name: 'S3_DATA_EVENTS',
    };
  }
}
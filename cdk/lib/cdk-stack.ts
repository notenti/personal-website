import {
  Stack,
  StackProps,
  RemovalPolicy,
  aws_lambda as lambda,
  aws_events as events,
  aws_events_targets as targets,
  aws_route53 as route53,
  aws_dynamodb as dynamodb,
  aws_certificatemanager as acm,
  aws_cloudfront as cloudfront,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_route53_targets as route53targets,
  Duration,
} from "aws-cdk-lib";

import * as dotenv from "dotenv";

import * as pyLambda from "@aws-cdk/aws-lambda-python-alpha";
import * as goLambda from "@aws-cdk/aws-lambda-go-alpha";
import * as apigw2 from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

import { Construct } from "constructs";
import * as path from "path";

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

    const lambdaFuncDir = path.join(__dirname, "..", "..", "lambda");
    const backendFuncDir = path.join(__dirname, "..", "..", "backend");
    const frontendBuildDir = path.join(
      __dirname,
      "..",
      "..",
      "frontend",
      "build"
    );

    const spotifyTable = new dynamodb.Table(this, "spotifyTable", {
      tableName: "spotify",
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: { name: "year", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      timeToLiveAttribute: "expiration_timestamp",
    });

    const pelotonTable = new dynamodb.Table(this, "pelotonTable", {
      tableName: "peloton",
      readCapacity: 1,
      writeCapacity: 1,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: {
        name: "fitness_discipline",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      timeToLiveAttribute: "expiration_timestamp",
    });

    pelotonTable.addGlobalSecondaryIndex({
      indexName: "duration-index",
      partitionKey: { name: "duration", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const populateLambda = new pyLambda.PythonFunction(this, "PopulateLambda", {
      entry: lambdaFuncDir,
      runtime: lambda.Runtime.PYTHON_3_7,
      index: "index.py",
      handler: "handler",
      timeout: Duration.seconds(45),
      layers: [
        new pyLambda.PythonLayerVersion(this, "PopulateLambdaLayer", {
          entry: lambdaFuncDir,
        }),
      ],
      environment: {
        SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID!,
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET!,
        SPOTIFY_REFRESH_TOKEN: process.env.SPOTIFY_REFRESH_TOKEN!,
        PELOTON_USERNAME: process.env.PELOTON_USERNAME!,
        PELOTON_PASSWORD: process.env.PELOTON_PASSWORD!,
        PELOTON_USER_TOKEN: process.env.PELOTON_USER_TOKEN!,
      },
    });

    const everyHourRule = new events.Rule(this, "hourRule", {
      schedule: events.Schedule.cron({ minute: "0" }),
    });

    everyHourRule.addTarget(new targets.LambdaFunction(populateLambda));

    targets.addLambdaPermission(everyHourRule, populateLambda);

    const backendLambda = new goLambda.GoFunction(this, "BackendLambda", {
      entry: backendFuncDir,
      runtime: lambda.Runtime.GO_1_X,
    });

    spotifyTable.grantWriteData(populateLambda);
    spotifyTable.grantReadData(backendLambda);
    pelotonTable.grantWriteData(populateLambda);
    pelotonTable.grantReadData(backendLambda);

    const frontendBucket = new s3.Bucket(this, "WebsiteFrontend", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const bucketDeployment = new s3deploy.BucketDeployment(
      this,
      "DeployWebsiteFrontend",
      {
        sources: [s3deploy.Source.asset(frontendBuildDir)],
        destinationBucket: frontendBucket,
      }
    );

    bucketDeployment.node.addDependency(frontendBucket);

    const hostedZone = route53.HostedZone.fromLookup(
      this,
      "WebsiteHostedZone",
      {
        domainName: "nateotenti.com",
      }
    );

    const frontendCertificate = new acm.DnsValidatedCertificate(
      this,
      "WebsiteFrontendCertificate",
      {
        domainName: "www.nateotenti.com",
        hostedZone: hostedZone,
        region: "us-east-1",
      }
    );

    const apiCertificate = new acm.DnsValidatedCertificate(
      this,
      "WebsiteApiCertificate",
      {
        domainName: "api.nateotenti.com",
        hostedZone: hostedZone,
      }
    );

    const domain = new apigw2.DomainName(this, "WebsiteDomainName", {
      domainName: "api.nateotenti.com",
      certificate: apiCertificate,
      securityPolicy: apigw2.SecurityPolicy.TLS_1_2,
    });

    const httpApi = new apigw2.HttpApi(this, "WebsiteApiGateway", {
      apiName: "WebsiteApi",
      corsPreflight: {
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
        ],
        allowMethods: [
          apigw2.CorsHttpMethod.OPTIONS,
          apigw2.CorsHttpMethod.GET,
          apigw2.CorsHttpMethod.POST,
          apigw2.CorsHttpMethod.PUT,
          apigw2.CorsHttpMethod.PATCH,
          apigw2.CorsHttpMethod.DELETE,
        ],
        allowCredentials: true,
        allowOrigins: ["http://localhost:3000", "https://www.nateotenti.com"],
      },
      defaultDomainMapping: {
        domainName: domain,
      },
    });

    httpApi.addRoutes({
      path: "/songs",
      methods: [apigw2.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "BackendIntegration",
        backendLambda,
        {
          payloadFormatVersion: apigw2.PayloadFormatVersion.VERSION_1_0,
        }
      ),
    });
    httpApi.addRoutes({
      path: "/workouts",
      methods: [apigw2.HttpMethod.GET],
      integration: new HttpLambdaIntegration(
        "BackendIntegration",
        backendLambda,
        {
          payloadFormatVersion: apigw2.PayloadFormatVersion.VERSION_1_0,
        }
      ),
    });

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "WebsiteDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: frontendBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
        viewerCertificate: {
          aliases: ["www.nateotenti.com"],
          props: {
            acmCertificateArn: frontendCertificate.certificateArn,
            sslSupportMethod: "sni-only",
            minimumProtocolVersion: "TLSv1.2_2021",
          },
        },
      }
    );

    const websiteARecord = new route53.ARecord(this, "WebsiteFrontendRecord", {
      recordName: "www.nateotenti.com",
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53targets.CloudFrontTarget(distribution)
      ),
    });

    const apiRecord = new route53.ARecord(this, "WebsiteAPIRecord", {
      recordName: "api",
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53targets.ApiGatewayv2DomainProperties(
          domain.regionalDomainName,
          domain.regionalHostedZoneId
        )
      ),
    });
  }
}

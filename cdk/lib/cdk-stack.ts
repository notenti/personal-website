import {
  Stack,
  StackProps,
  RemovalPolicy,
  aws_lambda as lambda,
  aws_events as events,
  aws_events_targets as targets,
  aws_iam as iam,
  aws_dynamodb as dynamodb,
  Duration,
} from "aws-cdk-lib";

import * as dotenv from "dotenv";

import * as pyLambda from "@aws-cdk/aws-lambda-python-alpha";

import { Construct } from "constructs";
import * as path from "path";

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

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

    const funcDir = path.join(__dirname, "..", "..", "populate");

    const lambdaFunc = new pyLambda.PythonFunction(this, "lambdaFunction", {
      entry: funcDir,
      runtime: lambda.Runtime.PYTHON_3_7,
      index: "index.py",
      handler: "handler",
      timeout: Duration.seconds(45),
      layers: [
        new pyLambda.PythonLayerVersion(this, "PythonLayerNate", {
          entry: funcDir,
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

    const eventRule = new events.Rule(this, "hourRule", {
      schedule: events.Schedule.cron({ minute: "0" }),
    });

    eventRule.addTarget(
      new targets.LambdaFunction(lambdaFunc, {
        event: events.RuleTargetInput.fromObject({ message: "Hello Lambda" }),
      })
    );

    targets.addLambdaPermission(eventRule, lambdaFunc);

    spotifyTable.grantWriteData(lambdaFunc);
    pelotonTable.grantWriteData(lambdaFunc);
  }
}

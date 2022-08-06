#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkStack } from "../lib/cdk-stack";
import { CodePipelineStack } from "../lib/codepipeline-stack";

const app = new cdk.App();
const env = { account: "249702126102", region: "us-east-1" };

new CodePipelineStack(app, "WebsiteCodePipelineStack", { env: env });

app.synth();

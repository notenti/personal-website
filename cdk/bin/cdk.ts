#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkStack } from "../lib/cdk-stack";

const app = new cdk.App();

const envUSA = { account: "249702126102", region: "us-east-1" };
new CdkStack(app, "CdkStack", { env: envUSA });

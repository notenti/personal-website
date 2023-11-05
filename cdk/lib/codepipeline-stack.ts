import { Stack, StackProps } from "aws-cdk-lib";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";

export class CodePipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new CodePipeline(this, "Pipeline", {
      pipelineName: "WebsitePipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.gitHub("notenti/personal-website", "master"),
        installCommands: ['npm i -g npm@latest'],
        commands: [
          "folder=$(ls)",
          "cd ${folder}/cdk",
          "npm ci",
          "mkdir -p /tmp/cdk.out/",
          "pushd ../frontend",
          "npm run build",
          "popd",
          "npx cdk synth -o /tmp/cdk.out",
        ],
      }),
    });
  }
}

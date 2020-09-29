# Power Dialer

## Documentation 

To understand every details and decisions made along the project, please check the [this documentation](https://drive.google.com/file/d/1GFxVzA8p4Fsl8D2DiYkavKjVeOygeHfj/view?usp=sharing).

## Deploy 

### Using the Documentation Deploy 

If you want to implement this Power Dialer step by step, using the Twilio Console directly and Twilio Functions, you can follow the documentation of the previous section. From this repository, you can use the serverless project inside `src/serverless/main`.

### Using Infra-as-Code to Deploy (Recommended)

If you want to implement this Power Dialer using Infra-as-code approach, following is how to do that using Twilio and Pulumi. We recommend this approach because by using Infra-as-code you have a better control of all the project components and can easily handle different environments/projects without worrying about environment variables.  

#### Pulumi CLI

First, you need to install the Pulumi CLI in your system. This CLI will be needed to test your code. Please refer to this [link](https://www.pulumi.com/docs/reference/cli/). 

After installing the CLI, you need to login using `pulumi login`. By default, this will log in to the managed Pulumi service backend. If you prefer to log in to a self-hosted Pulumi service backend, specify a URL. For more information, please refer to this [link](https://www.pulumi.com/docs/reference/cli/pulumi_login/).  Also, check the `State and Backends` section to understand how states are handled. 

#### How to Use

1. Create you Pulumi project file by copying the example (`cp Pulumi.example.yaml Pulumi.yaml`) and setting name, runtime (keep as it is) and description.

2. Create the Pulumi stack for your current environment. For example, for dev you can run `pulumi stack init dev`.

3. For CI/CD environments, you need to add same environment variables to your secrets in your system. In the case of `GitHub Actions`, you can use `Secrets` as described [here](https://docs.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets). The mapping is as following:

- PULUMI_ACCESS_TOKEN
- TWILIO_<BRANCH_NAME>_ACCOUNT_SID
- TWILIO_<BRANCH_NAME>_AUTH_TOKEN

2. For development environment, you should copy the .dev.env.example (`cp .dev.env.example .dev.env`) and fill out the variables. Also, do not forget to add `.dev.env` files to all your serverless directories. After that, you can run the package scripts without the `ci:` in the beginning of their names. For example: 

- **deploy-resources**: deploy all resources to your dev project
- **preview-resources**: preview all changes to your dev project
- **watch-resources**: this sends all changes to your dev project on the fly (as soon as the changes are saved in the file). It is similar to a `hot reload` feature and in my opinion it is **an amazing feature for developing and testing without using the console at all!**

If you want to test different branches locally, you can change the environment variables for each branch. Remember, the idea is that each branch/stack is a different Twilio Project (but you can change this abstraction depending on your use case). 

**Remember:** if you deploy this repository, it may incur cost from Twilio side.    

#### CI/CD with Pulumi

For this project, we are going to use `Github Actions` with Pulumi as described [here](https://www.pulumi.com/docs/guides/continuous-delivery/github-actions/). If you want to implmenet it with other CI/CD environment, please refer to this [link](https://www.pulumi.com/docs/guides/continuous-delivery/).

In this project, you can check how to configure it by checking workflow files inside `.github/workflows`.
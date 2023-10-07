# WeData Test

Wedata 测试扩展提供了在项目中测试和管理数据质量规则的功能。它包括一个树视图，用于显示和管理不同数据质量规则的代码片段，以及用于运行测试、打开新文件、刷新树视图和打开自定义数据库视图的命令。

## 功能

- **树视图**：该扩展提供了一个树视图，用于显示不同数据质量规则的代码片段。您可以展开和折叠树节点，以查看和管理可用的代码片段。

- **代码片段插入**：您可以通过选择树视图中的节点或使用“打开新文件”命令将代码片段插入到活动编辑器中。插入的代码片段包含针对特定数据质量规则的预定义代码。

- **测试执行**：该扩展包括一个运行测试的命令。然而，代码片段中没有提供测试执行逻辑的实现。您可以根据需要扩展该扩展，添加执行测试所需的逻辑。

- **自定义数据库视图**：该扩展提供一个打开自定义数据库视图的命令。代码片段注册了一个命令，使用自定义 URI (`wedata-db://dbView`) 执行 `vscode.open` 命令来打开自定义的数据库视图。您可以根据特定需求自定义 URI 方案和目标视图。


## 使用方法

1. 在 Visual Studio Code 中安装 WeData Test扩展。
2. 单击侧边栏中的树视图图标打开扩展的树视图。
3. 展开树节点以查看不同数据质量规则的可用代码片段。
4. 要将代码片段插入到活动编辑器中：
   - 在树视图中选择一个节点，然后单击“插入代码片段”按钮。
   - 或者，使用“打开新文件”命令，它会将一个预定义的代码片段插入到活动编辑器中。
5. 根据项目的要求自定义代码片段，并添加执行测试所需的逻辑。
6. 使用提供的命令来运行测试、刷新树视图或打开自定义数据库视图。

## 后续开发


- **实现测试执行逻辑**：已注册 `wedata-test.runTest` 命令，但没有提供实现。添加必要的逻辑来执行根据插入的代码片段运行测试。

- **扩展树视图**：可以向树视图添加更多的节点和代码片段，以覆盖更多的数据质量规则或类别。修改 `SnippetsTreeDataProvider` 类以包含新的代码片段，并相应地更新 `addSnippet` 方法。

- **自定义数据库视图**：`wedata-test.openDBView` 命令当前使用预定义的 URI (`wedata-db://dbView`) 打开自定义数据库视图。可以自定义 URI 方案，并实现逻辑来打开适合您需求的视图。


## 发布说明

### 1.0.0

WeData Test 扩展的初始版本。

## 许可证

该扩展根据 [MIT 许可证](LICENSE) 授权。

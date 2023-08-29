pnpm是凭什么对npm和yarn降维打击的？
commit检查 husky 初始化npx husky install
将pnpm lint 纳入commit时husky将执行的脚本
npx husky add .husky/pre-commit "pnpm lint"

pnpm lint 会对代码全量检查，当项目复杂后执行速度可能比较慢，届时可以考虑使用lint-staged实现只对暂存区代码进行检查

commitlint 对git提交信息进行检查
首先安装必要的库
pnpm i commitlint @commitlint/cli @commitlint/config-conventional -D -w
配置文件
module.export = {
extends: ['@commitlint/config-conventional']
};
集成到husky中
npx husky add .husky/commit-msg "npx --no-intall commitlint -e $HUSKY_GIT_PARAMS"

conventional 规范集的意义  
//提交的类型： 摘要信息
<type> :<subject>
常用的type值包括：
feat（特性）：新增功能或新功能的开发。
fix（修复）：修复bug。
docs（文档）：更新文档或添加文档。
style（样式）：调整代码格式、空格、缩进等，不涉及代码逻辑。
refactor（重构）：代码重构，既不是修复bug也不是新增功能。
test（测试）：添加、修改或执行测试代码。
chore（杂项）：与代码相关的其他任务，如构建脚本、工具配置等。

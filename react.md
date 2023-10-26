pnpm i -D -w rimraf 删除上一个打包文件
pnpm i -D -w @rollup/plugin-commonjs es转cjs

npm i -D -w rollup-plugin-typescript2 typescript解析

pnpm i -D -w rollup-plugin-generate-package-json打包文件生成package.json

//为开发环境增加**Dev**的标识，方便Dev包打印更多信息
pnpm i -d -w @rollup/plugin-replace
if(\_\_Dev\_\_){ 开发环境xxx }else { 生产环境xxx}

commit的3个阶段
beforeMutation
Mutation
layout

pnpm i -D -w @rollup/plugin-alias rollup配置alias

react源码细节

children 作为props时
仅仅只能通过props.children拿到
他并没有添加到children 中，当渲染完成后 props.children 是整个fiber中的，所以children元素并不能传递

为什么在beginWork阶段和 completeWork阶段都要标记Ref

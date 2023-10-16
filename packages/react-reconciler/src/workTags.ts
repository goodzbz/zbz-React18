export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponent
	| typeof HostText
	| typeof Fragment;
export const FunctionComponent = 0; // FunctionComponent（函数组件）
export const HostRoot = 3; // 根组件 React顶层
export const HostComponent = 5; // 原生组件 div/p/span
export const HostText = 6; // 文本节点
export const Fragment = 7;

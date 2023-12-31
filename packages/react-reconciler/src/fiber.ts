import { Props, Key, Ref, ReactElementType, Wakeable } from 'shared/ReactTypes';
import {
	ContextProvider,
	FunctionComponent,
	HostComponent,
	OffscreenComponent,
	SuspenseComponent,
	WorkTag,
} from './workTags';
import { Flags, NoFlags } from './fiberFlags';
import { Container } from 'hostConfig';
import { Fragment } from './workTags';
import { Lane, Lanes, NoLane, NoLanes } from './fiberLanes';
import { Effect } from './fiberHooks';
import { CallbackNode } from 'scheduler';
import { REACT_PROVIDER_TYPE, REACT_SUSPENSE_TYPE } from 'shared/ReactSymbols';
import { OffscreenProps } from './beginWork';

// ReactElement 数据--》 FiberNode 数据+关系 ----> 真实Dom
// FiberNode
export class FiberNode {
	type: any;
	tag: WorkTag; // 类型标记
	pendingProps: Props;
	key: Key;
	stateNode: any; // HostRootFiber stateNode指向FiberRootNode/ 类组件为该组件实例/ 原生Dom元素是Dom节点的引用
	return: FiberNode | null; // 父亲
	sibling: FiberNode | null; // 兄弟
	child: FiberNode | null; // 儿子
	index: number; // 儿子标号
	ref: Ref | null;
	flags: Flags; // 操作标记

	memoizedState: any;
	updateQueue: unknown;
	subtreeFlags: Flags;
	memoizedProps: Props | null;
	alternate: FiberNode | null;
	deletions: FiberNode[] | null;
	constructor(tag: WorkTag, pendingProps: Props, key: Key) {
		this.tag = tag;
		this.key = key || null;
		this.stateNode = null; // (DOM)
		this.type = null; // (FunctionComponent)

		// 生成树状结构
		this.return = null;
		this.sibling = null;
		this.child = null;
		this.index = 0;

		this.ref = null;

		// 作为工作单元
		this.pendingProps = pendingProps;
		this.memoizedProps = null;
		this.updateQueue = null;
		this.memoizedState = null;

		this.alternate = null;
		// 副作用
		this.flags = NoFlags;
		this.subtreeFlags = NoFlags;
		this.deletions = null;
	}
}

export interface PendingPassiveEffects {
	unmount: Effect[];
	update: Effect[];
}
// tag  FiberNode属于xx类型节点
// FiberRootNode        根--》HostRootFiber ---》 app（一代标签）
export class FiberRootNode {
	container: Container;
	current: FiberNode;
	finishedWork: FiberNode | null; // 指向更新完成的hostRootFiber
	pendingLanes: Lanes;
	finishedLane: Lane;
	pendingPassiveEffects: PendingPassiveEffects;

	callbackNode: CallbackNode | null;
	callbakcPriority: Lane;

	// WeakMap {promise: Set<Lane>}
	pingCache: WeakMap<Wakeable<any>, Set<Lane>> | null;
	suspendedLanes: Lanes; // 当前所有被挂起的更新
	pingLanes: Lane; // 当前被挂起且被ping的

	constructor(container: Container, hostRootFiber: FiberNode) {
		// container 是元素  hostRootFiber
		this.container = container;
		this.current = hostRootFiber;
		hostRootFiber.stateNode = this;
		this.finishedWork = null;
		this.pendingLanes = NoLanes;
		this.suspendedLanes = NoLanes;
		this.pingLanes = NoLanes;

		this.finishedLane = NoLane;

		this.callbackNode = null;
		this.callbakcPriority = NoLane;

		this.pendingPassiveEffects = {
			unmount: [],
			update: [],
		};
		this.pingCache = null;
	}
}

export const createWorkInProcess = (
	current: FiberNode,
	pendingProps: Props
): FiberNode => {
	let wip = current.alternate;
	if (wip === null) {
		// mount
		wip = new FiberNode(current.tag, pendingProps, current.key);
		wip.stateNode = current.stateNode;
		wip.alternate = current;
		current.alternate = wip;
	} else {
		wip.pendingProps = pendingProps;
		wip.flags = NoFlags;
		wip.subtreeFlags = NoFlags;
		wip.deletions = null;
	}
	wip.type = current.type;
	wip.updateQueue = current.updateQueue;
	wip.child = current.child;
	wip.memoizedState = current.memoizedState;
	wip.memoizedProps = current.memoizedProps;
	wip.ref = current.ref;

	// lane?
	return wip;
};

export function createFiberFromElement(element: ReactElementType) {
	const { type, key, props, ref } = element;
	let fiberTag: WorkTag = FunctionComponent;
	if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else if (
		typeof type === 'object' &&
		type.$$typeof === REACT_PROVIDER_TYPE
	) {
		fiberTag = ContextProvider;
	} else if (type === REACT_SUSPENSE_TYPE) {
		fiberTag = SuspenseComponent;
	} else if (typeof type !== 'function' && __DEV__) {
		console.warn('为定义的type类型', element);
	}
	const fiber = new FiberNode(fiberTag, props, key);
	fiber.type = type;
	fiber.ref = ref;
	return fiber;
}

export function createFiberFromFragment(element: any[], key: Key): FiberNode {
	const fiber = new FiberNode(Fragment, element, key);
	return fiber;
}

export function createFiberFromOffscreen(
	pendingProps: OffscreenProps
): FiberNode {
	const fiber = new FiberNode(OffscreenComponent, pendingProps, null);
	return fiber;
}

// type 属性表示组件节点的类型。对于不同类型的组件或元素，type 可以是以下几种取值：
// 函数组件：函数本身，即函数组件的定义。
// 类组件：类本身，即组件的构造函数。
// 原生 DOM 元素：字符串，表示对应的 HTML 标签名称。
// tag 属性表示 Fiber 节点的标记信息，用于指示该节点的特定类型和状态，如：

// HostComponent：原生 DOM 元素节点。
// ClassComponent：类组件节点。
// FunctionComponent：函数组件节点。
// HostRoot：根节点。
// HostText：文本节点。
// tag 属性更多地用于标识节点的内部类型和处理逻辑，而 type 属性则更加关注组件节点的具体类型。它们在 React 的协调和渲染过程中扮演着不同的角色

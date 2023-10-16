import { Container } from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import { HostRoot } from './workTags';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
} from 'react/src/updateQueue';
import { ReactElementType } from 'shared/ReactTypes';
import { scheduleUpdateOnFiber } from './workLoop';
import { requestUpdateLane } from './fiberLanes';

// 创建 FiberRootNode 和 HostRootFiber 并返回FiberRootNode
export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null); // 谁才是FiberRootNode  我先前的理解是 hostRootFiber是根节点 错了 root才是 ，他是根节点的引用
	const root = new FiberRootNode(container, hostRootFiber);
	hostRootFiber.updateQueue = createUpdateQueue(); // 创建更新队列
	return root;
}

// 建立 FiberRootNode 和 HostRootFiber 的关系并 创建更新队列
export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	const hostRootFiber = root.current;
	const lane = requestUpdateLane();
	const update = createUpdate<ReactElementType | null>(element, lane); // 创建更新操作 element： 标签/State/State方法
	enqueueUpdate(
		// 添加到队列中
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);
	scheduleUpdateOnFiber(hostRootFiber, lane); // hostRootFiber是
	return element;
}

// 写下流程
// 首先 Fiber双缓存
//  有current / workinprcess

//  预备工作  更新-----》   react18中 更新机制由setState发生变化 也有 Dom生变化 （类组件/函数组件）  我需要同一一个入口可以修改他们
//   对于函数和state 我拿到的就是值  对于element  我直接拿到element用于获取Dom去生成workinprocess树---》 用于挂载和更新机制
//  创建更新队列，更新方法
//  创建 HostFiberNode/RootFiberNode
//  创建workinProcess
//  联系起来 调用rootRender方法
//  进入beginWork
// 判断类型 HostFiberNode / HostComponent/ HostText
//  beginWork来生成workinprocess树  找孩子 建立关系  mount时候要挂载 需要赋值操作类型
//  HostFiberNode进入的时候由current 进入的是update逻辑（通过类型判断） 会给予placement操作，故mount的挂载实现
//  其他类型fiber进入的时候根据子孩子的element生成Fiber 建立联系， text进入说明结束流程 开始归阶段处理

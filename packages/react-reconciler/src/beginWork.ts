import { UpdateQueue, processUpdataQueue } from 'react/src/updateQueue';
import { FiberNode } from './fiber';
import {
	HostComponent,
	HostRoot,
	HostText,
	FunctionComponent,
	Fragment,
} from './workTags';
import { ReactElementType } from 'shared/ReactTypes';
import { reconcileChildFibers, mountChildFibers } from '../src/childFibers';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';

// 递归阶段中的递阶段
export const beginWork = (wip: FiberNode, renderLane: Lane) => {
	// 比较,返回子fiberNode
	switch (wip.tag) {
		case HostRoot:
			return updateHostRoot(wip, renderLane);
		case HostComponent:
			return updateHostComponent(wip);
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip, renderLane);

		case Fragment:
			return updateFragment(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork未实现的类型');
			}
	}
	return null;
};

function updateFragment(wip: FiberNode) {
	const nextChildren = wip.pendingProps;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateFunctionComponent(wip: FiberNode, renderLane: Lane) {
	const nextChildren = renderWithHooks(wip, renderLane); // 修改
	reconcileChildren(wip, nextChildren); // 返回子FiberNode
	return wip.child;
}

function updateHostRoot(wip: FiberNode, renderLane: Lane) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdataQueue(baseState, pending, renderLane);
	// null
	wip.memoizedState = memoizedState;
	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren); // 返回子FiberNode
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children; // 修改
	reconcileChildren(wip, nextChildren); // 返回子FiberNode
	return wip.child;
}

function reconcileChildren(wip: FiberNode, children: ReactElementType) {
	const current = wip.alternate;
	// current是hostRootFiber
	if (current !== null) {
		//注意 初始化mount的时候 FIberRootNode节点是进入的该种状况
		// update
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// mount
		wip.child = mountChildFibers(wip, null, children);
	}
}

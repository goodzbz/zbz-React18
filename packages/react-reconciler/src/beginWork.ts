import { UpdateQueue, processUpdataQueue } from 'react/src/updateQueue';
import {
	FiberNode,
	createFiberFromFragment,
	createFiberFromOffscreen,
	createWorkInProcess,
} from './fiber';
import {
	HostComponent,
	HostRoot,
	HostText,
	FunctionComponent,
	Fragment,
	ContextProvider,
	SuspenseComponent,
	OffscreenComponent,
} from './workTags';
import { ReactElementType } from 'shared/ReactTypes';
import { reconcileChildFibers, mountChildFibers } from '../src/childFibers';
import { renderWithHooks } from './fiberHooks';
import { Lane } from './fiberLanes';
import { ChildDeletion, Placement, Ref } from './fiberFlags';
import { pushProvider } from './fiberContext';
import { createElement } from 'react';

export interface OffscreenProps {
	mode: 'visible' | 'hidden';
	children: any;
}

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
		case ContextProvider:
			return updateContextProvider(wip);
		case SuspenseComponent:
			return updateSuspenseComponent(wip);
		case OffscreenComponent:
			return updateOffscreenComponent(wip);
		default:
			if (__DEV__) {
				console.warn('beginWork未实现的类型');
			}
	}
	return null;
};

function updateSuspenseComponent(wip: FiberNode) {
	const current = wip.alternate;
	const nextProps = wip.pendingProps;

	let showFallback = false;
	const didSuspend = true;

	if (didSuspend) {
		showFallback = true;
	}
	const nextPrimaryChildren = nextProps.children;
	const nextFallbackChildren = nextProps.fallback;

	if (current === null) {
		// mount
		if (showFallback) {
			//挂起
			return mountSuspenseFallbackChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			// 正常
			return mountSuspensePrimaryChildren(wip, nextPrimaryChildren);
		}
	} else {
		// updata
		if (showFallback) {
			// 挂起
			return updateSuspenseFallbackChildren(
				wip,
				nextPrimaryChildren,
				nextFallbackChildren
			);
		} else {
			//正常
			return updateSuspensePrimaryChildren(wip, nextPrimaryChildren);
		}
	}
}

function updateSuspensePrimaryChildren(wip: FiberNode, primaryChildren: any) {
	const current = wip.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;

	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren,
	};
	const primaryChildFragment = createWorkInProcess(
		currentPrimaryChildFragment,
		primaryChildProps
	);

	primaryChildFragment.return = wip;
	primaryChildFragment.sibling = null;
	wip.child = primaryChildFragment;

	if (currentFallbackChildFragment !== null) {
		const deletions = wip.deletions;
		if (deletions === null) {
			wip.deletions = [currentFallbackChildFragment];
			wip.flags |= ChildDeletion;
		} else {
			deletions.push(currentFallbackChildFragment);
		}
	}

	return primaryChildFragment;
}
function updateSuspenseFallbackChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const current = wip.alternate as FiberNode;
	const currentPrimaryChildFragment = current.child as FiberNode;
	const currentFallbackChildFragment: FiberNode | null =
		currentPrimaryChildFragment.sibling;

	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren,
	};
	const primaryChildFragment = createWorkInProcess(
		currentPrimaryChildFragment,
		primaryChildProps
	);
	let fallbackChildFragment;
	if (currentFallbackChildFragment !== null) {
		fallbackChildFragment = createWorkInProcess(
			currentFallbackChildFragment,
			fallbackChildren
		);
	} else {
		fallbackChildFragment = createFiberFromFragment(fallbackChildren, null);
		fallbackChildFragment.flags |= Placement;
	}
	fallbackChildFragment.return = wip;
	primaryChildFragment.return = wip;
	primaryChildFragment.sibling = fallbackChildFragment;
	wip.child = primaryChildFragment;
	return fallbackChildFragment;
}

function mountSuspensePrimaryChildren(wip: FiberNode, primaryChildren: any) {
	const primaryChildProps: OffscreenProps = {
		mode: 'visible',
		children: primaryChildren,
	};
	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	wip.child = primaryChildFragment;
	primaryChildFragment.return = wip;
	return primaryChildFragment;
}

function mountSuspenseFallbackChildren(
	wip: FiberNode,
	primaryChildren: any,
	fallbackChildren: any
) {
	const primaryChildProps: OffscreenProps = {
		mode: 'hidden',
		children: primaryChildren,
	};
	const primaryChildFragment = createFiberFromOffscreen(primaryChildProps);
	const flalbackChildFragment = createFiberFromFragment(fallbackChildren, null);

	flalbackChildFragment.flags |= Placement;

	primaryChildFragment.return = wip;
	fallbackChildren.return = wip;
	primaryChildFragment.sibling = flalbackChildFragment;
	wip.child = primaryChildFragment;
	return flalbackChildFragment;
}

function updateOffscreenComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateContextProvider(wip: FiberNode) {
	const providerType = wip.type;
	const context = providerType._context;
	const newProps = wip.pendingProps;
	const nextChildren = newProps.children;

	//TODO
	pushProvider(context, newProps.value);

	reconcileChildren(wip, nextChildren);
	return wip.child;
}

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
	markRef(wip.alternate, wip);
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

function markRef(current: FiberNode | null, workInProgress: FiberNode) {
	const ref = workInProgress.ref;
	if (
		(current === null && ref !== null) ||
		(current !== null && current.ref !== ref)
	) {
		workInProgress.flags |= Ref;
	}
}

import {
	Container,
	appendInitialChild,
	createInstance,
	createTextInstance,
} from 'hostConfig';
import { FiberNode } from './fiber';
import {
	ContextProvider,
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
	OffscreenComponent,
	SuspenseComponent,
} from './workTags';
import { NoFlags, Ref, Update, Visibility } from './fiberFlags';
import { updateFiberProps } from 'react-dom/src/SyntheticEvent';
import { Fragment } from './workTags';
import { popProvider } from './fiberContext';

function markRef(fiber: FiberNode) {
	fiber.flags |= Ref;
}

function markUpdate(fiber: FiberNode) {
	fiber.flags |= Update;
}

export const completeWork = (wip: FiberNode) => {
	// 递归中的归
	const newProps = wip.pendingProps;
	const current = wip.alternate;
	switch (wip.tag) {
		case HostComponent:
			if (current !== null && wip.stateNode) {
				// update
				//props是否变化
				//变了 Update flag
				updateFiberProps(wip.stateNode, newProps);
				// 标记Ref
				if (current.ref !== wip.ref) {
					markRef(wip);
				}
			} else {
				//mount
				// 1.构建DOM
				const instance = createInstance(wip.type, newProps);
				// 2. 将DOM插入到DOM树中
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
				// 标记Ref
				if (wip.ref !== null) {
					markRef(wip);
				}
			}
			bubbleProperties(wip);
			return null;
		case HostText:
			if (current !== null && wip.stateNode) {
				const oldText = current.memoizedProps?.content;
				const newText = newProps.content;
				if (oldText !== newText) {
					markUpdate(wip);
				}
			} else {
				const instance = createTextInstance(newProps.content);
				appendAllChildren(instance, wip);
				wip.stateNode = instance;
				bubbleProperties(wip);
				return null;
			}
			break;
		case HostRoot:
			bubbleProperties(wip);
			return null;
		case FunctionComponent:
			bubbleProperties(wip);
			return null;
		case Fragment:
			bubbleProperties(wip);
			return null;
		case ContextProvider:
			const context = wip.type._context;
			popProvider(context);
			bubbleProperties(wip);
			return null;
		case OffscreenComponent:
			bubbleProperties(wip);
			return null;
		case SuspenseComponent:
			const offscreenFiber = wip.child as FiberNode;
			const isHidden = offscreenFiber.pendingProps.mode === 'hidden';
			const currentOffscreenFiber = offscreenFiber.alternate;

			if (currentOffscreenFiber !== null) {
				// update
				const wasHidden = currentOffscreenFiber.pendingProps.mode === 'hidden';
				if (isHidden !== wasHidden) {
					offscreenFiber.flags |= Visibility;
					bubbleProperties(offscreenFiber);
				}
			} else if (isHidden) {
				offscreenFiber.flags |= Visibility;
				bubbleProperties(offscreenFiber);
			}
			bubbleProperties(wip);

			//...
			return null;
		default:
			if (__DEV__) {
				console.warn('未处理的completeWork情况', wip);
			}
	}
	return null;
};

function appendAllChildren(parent: Container, wip: FiberNode) {
	let node = wip.child;
	while (node !== null) {
		if (node.tag === HostComponent || node.tag === HostText) {
			appendInitialChild(parent, node?.stateNode);
		} else if (node.child !== null) {
			// 针对 react组件来写的  要拿到child
			node.child.return = node;
			node = node.child; // 得到单个的Dom，而非函数组件名
			continue;
		}
		if (node === wip) {
			return;
		}
		while (node.sibling === null) {
			// 字类的层级查找完毕 该向上回去
			if (node.return === null || node.return === wip) {
				return;
			}
			node = node?.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

function bubbleProperties(wip: FiberNode) {
	let subtreeFlags = NoFlags;
	let child = wip.child;
	while (child !== null) {
		subtreeFlags |= child.subtreeFlags;
		subtreeFlags |= child.flags;
		child.return = wip;
		child = child.sibling;
	}
	wip.subtreeFlags |= subtreeFlags;
}

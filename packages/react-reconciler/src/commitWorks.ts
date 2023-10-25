import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild,
} from 'hostConfig';
import { FiberNode, FiberRootNode, PendingPassiveEffects } from './fiber';
import {
	ChildDeletion,
	Flags,
	MutationMask,
	NoFlags,
	PassiveEffect,
	PassiveMask,
	Placement,
	Update,
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from './workTags';
import { Effect, FCUpdateQueue } from './fiberHooks';
import { HookHasEffect } from './hookEffectTags';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
	nextEffect = finishedWork;
	while (nextEffect !== null) {
		const child: FiberNode | null = nextEffect.child;
		if (
			(nextEffect.subtreeFlags & (MutationMask | PassiveMask)) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 向上遍历 DFS
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect, root); // 思考 这里不会重复处理同一个节点么  父节点，父节点下面的节点 可能会同时操作
				const sibling: FiberNode | null = nextEffect.sibling;
				if (sibling !== null) {
					// 这个属于什么情况
					nextEffect = sibling;
					break up;
				}
				nextEffect = nextEffect.return;
			}
		}
	}
};

const commitMutationEffectsOnFiber = (
	finishedWork: FiberNode,
	root: FiberRootNode
) => {
	const flags = finishedWork.flags;
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		finishedWork.flags &= ~Placement;
	}
	// flags ChildDelete
	if ((flags & ChildDeletion) !== NoFlags) {
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((ChildToDelete) => {
				commitDeletion(ChildToDelete, root);
			});
		}
		finishedWork.flags &= ~ChildDeletion;
	}
	// flags Update
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}

	if ((flags & PassiveEffect) !== NoFlags) {
		// 收集回调
		commitPassiveEffect(finishedWork, root, 'update');
		finishedWork.flags &= ~PassiveEffect;
	}
};

function commitPassiveEffect(
	fiber: FiberNode,
	root: FiberRootNode,
	type: keyof PendingPassiveEffects
) {
	// update  unmount
	if (
		fiber.tag !== FunctionComponent ||
		(type === 'update' && (fiber.flags & PassiveEffect) === NoFlags)
	) {
		return;
	}
	const updateQueue = fiber.updateQueue as FCUpdateQueue<any>;
	if (updateQueue !== null) {
		if (updateQueue.lastEffect === null && __DEV__) {
			console.error('当FC存在PassiveEffect flag时，不应该不存在effect');
		}
		root.pendingPassiveEffects[type].push(updateQueue.lastEffect as Effect);
	}
}

function commitHookEffectList(
	flags: Flags,
	lastEffect: Effect,
	callback: (effect: Effect) => void
) {
	let effect = lastEffect.next as Effect;
	do {
		if ((effect.tag & flags) === flags) {
			callback(effect);
		}
		effect = effect.next as Effect;
	} while (effect !== lastEffect.next);
}

export function commitHookEffectListUnmount(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destory = effect.destory;
		if (typeof destory === 'function') {
			destory();
		}
		effect.tag &= ~HookHasEffect;
	});
}

export function commitHookEffectListDestory(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const destory = effect.destory;
		if (typeof destory === 'function') {
			destory();
		}
		effect.tag &= ~HookHasEffect;
	});
}
export function commitHookEffectListCreate(flags: Flags, lastEffect: Effect) {
	commitHookEffectList(flags, lastEffect, (effect) => {
		const create = effect.create;
		if (typeof create === 'function') {
			effect.destory = create();
		}
	});
}

function recordHostChildrenToDelete(
	childrenToDelete: FiberNode[],
	unmountFiber: FiberNode
) {
	//1  找到第一个 root host 节点
	const lastOne = childrenToDelete[childrenToDelete.length - 1];
	if (!lastOne) {
		childrenToDelete.push(unmountFiber);
	} else {
		let node = lastOne.sibling;
		while (node !== null) {
			if (unmountFiber === node) {
				childrenToDelete.push(unmountFiber);
			}
			node = node.sibling;
		}
	}
	// 2 每找到一个host节点 判断下 这个节点是不是 1 找到那个节点的兄弟节点
}

function commitDeletion(ChildToDelete: FiberNode, root: FiberRootNode) {
	const rootChildrenToDelete: FiberNode[] = [];
	// 递归子树
	commitNestedComponent(ChildToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				// 解绑ref
				return;
			case HostText:
				recordHostChildrenToDelete(rootChildrenToDelete, unmountFiber);
				return;
			case FunctionComponent:
				// TODO useEffect unmount\ 解绑ref
				commitPassiveEffect(unmountFiber, root, 'unmount');
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的ummount类型');
				}
				break;
		}
	});
	// 移除 rootHostNode的DOM
	if (rootChildrenToDelete.length) {
		const hostParent = getHostParent(ChildToDelete);
		if (hostParent !== null) {
			rootChildrenToDelete.forEach((node) => {
				removeChild(node.stateNode, hostParent);
			});
		}
	}
	ChildToDelete.return = null;
	ChildToDelete.child = null;
}

function commitNestedComponent(
	root: FiberNode,
	onCommitUnmount: (fiber: FiberNode) => void
) {
	let node = root;
	while (true) {
		onCommitUnmount(node);
		if (node.child !== null) {
			// 向下遍历的过程
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === root) {
			// 中止条件
			return;
		}
		while (node.sibling === null) {
			if (node.return === null || node.return === root) {
				return;
			}
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

const commitPlacement = (finshedWork: FiberNode) => {
	// parent Dom
	if (__DEV__) {
		console.warn('执行Placement操作', finshedWork);
	}
	const hostParent = getHostParent(finshedWork);

	//host sibing
	const sibling = getHostSibling(finshedWork);

	// finishedWork ~ Dom append parentDom
	if (hostParent !== null) {
		insertOrAppendPlacementNodeIntoContainer(finshedWork, hostParent, sibling);
	}
};

function getHostSibling(fiber: FiberNode) {
	let node: FiberNode = fiber;
	findSibing: while (true) {
		while (node.sibling === null) {
			const parent = node.return;
			if (
				parent === null ||
				parent.tag === HostComponent ||
				parent.tag === HostRoot
			) {
				return null;
			}
			node = parent;
		}
		node.sibling.return = node.return;
		node = node.sibling;
		while (node.tag !== HostText && node.tag !== HostComponent) {
			// 向下遍历
			if ((node.flags & Placement) !== NoFlags) {
				continue findSibing;
			}
			if (node.child === null) {
				continue findSibing;
			} else {
				node.child.return = node;
				node = node.child;
			}
			if ((node.flags & Placement) === NoFlags) {
				return node.stateNode;
			}
		}
	}
}

function getHostParent(fiber: FiberNode): Container | null {
	let parent = fiber.return;
	while (parent) {
		const parentTag = parent.tag;
		if (parentTag === HostComponent) {
			return parent.stateNode as Container;
		}
		if (parentTag === HostRoot) {
			return (parent.stateNode as FiberRootNode).container;
		}
		parent = parent.return;
	}
	if (__DEV__) {
		console.warn('未找到HostParent');
	}
	return null;
}
function insertOrAppendPlacementNodeIntoContainer(
	finshedWork: FiberNode,
	hostParent: Container,
	before?: Instance
) {
	if (finshedWork.tag === HostComponent || finshedWork.tag === HostText) {
		if (before) {
			insertChildToContainer(finshedWork.stateNode, hostParent, before);
		}
		appendChildToContainer(finshedWork.stateNode, hostParent);
		return;
	}
	const child = finshedWork.child;
	if (child !== null) {
		insertOrAppendPlacementNodeIntoContainer(child, hostParent);
		let sibling = child.sibling; // 对child的sibling 的情况是什么    xxx  这里有一个思考是fragment 但是不确定 后续还需要思考
		while (sibling) {
			insertOrAppendPlacementNodeIntoContainer(sibling, hostParent);
			sibling = sibling.sibling;
		}
	}
}

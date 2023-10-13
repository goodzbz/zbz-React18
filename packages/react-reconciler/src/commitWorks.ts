import {
	Container,
	Instance,
	appendChildToContainer,
	commitUpdate,
	insertChildToContainer,
	removeChild,
} from 'hostConfig';
import { FiberNode, FiberRootNode } from './fiber';
import {
	ChildDeletion,
	MutationMask,
	NoFlags,
	Placement,
	Update,
} from './fiberFlags';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText,
} from './workTags';

let nextEffect: FiberNode | null = null;

export const commitMutationEffects = (finishedWork: FiberNode) => {
	nextEffect = finishedWork;
	while (nextEffect !== null) {
		const child: FiberNode | null = nextEffect.child;
		if (
			(nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
			child !== null
		) {
			nextEffect = child;
		} else {
			// 向上遍历 DFS
			up: while (nextEffect !== null) {
				commitMutationEffectsOnFiber(nextEffect); // 思考 这里不会重复处理同一个节点么  父节点，父节点下面的节点 可能会同时操作
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

const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
	const flags = finishedWork.flags;
	if ((flags & Placement) !== NoFlags) {
		commitPlacement(finishedWork);
		finishedWork.flags &= ~Placement;
	}
	// flags Update
	if ((flags & Update) !== NoFlags) {
		commitUpdate(finishedWork);
		finishedWork.flags &= ~Update;
	}
	// flags ChildDelete
	if ((flags & ChildDeletion) !== NoFlags) {
		commitUpdate(finishedWork);
		const deletions = finishedWork.deletions;
		if (deletions !== null) {
			deletions.forEach((ChildToDelete) => {
				commitDeletion(ChildToDelete);
			});
		}
		finishedWork.flags &= ~ChildDeletion;
	}
};

function commitDeletion(ChildToDelete: FiberNode) {
	let rootHostNode: FiberNode | null = null;
	// 递归子树
	commitNestedComponent(ChildToDelete, (unmountFiber) => {
		switch (unmountFiber.tag) {
			case HostComponent:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				// 解绑ref
				return;
			case HostText:
				if (rootHostNode === null) {
					rootHostNode = unmountFiber;
				}
				break;
			case FunctionComponent:
				// TODO useEffect unmount
				return;
			default:
				if (__DEV__) {
					console.warn('未处理的ummount类型');
				}
				break;
		}
	});
	// 移除 rootHostNode的DOM
	if (rootHostNode !== null) {
		const hostParent = getHostParent(ChildToDelete);
		if (hostParent !== null) {
			removeChild((rootHostNode as FiberNode).stateNode, hostParent);
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

import { scheduleMicroTask } from 'hostConfig';
import { beginWork } from './beginWork';
import {
	commitHookEffectListCreate,
	commitHookEffectListDestory,
	commitHookEffectListUnmount,
	commitLayoutEffects,
	commitMutationEffects,
} from './commitWorks';
import { completeWork } from './completeWork';
import {
	FiberNode,
	FiberRootNode,
	PendingPassiveEffects,
	createWorkInProcess,
} from './fiber';
import { MutationMask, NoFlags, PassiveMask } from './fiberFlags';
import {
	Lane,
	NoLane,
	SyncLane,
	getHighestPriorityLane,
	lanesToSchedulerPriority,
	markRootFinished,
	mergeLanes,
} from './fiberLanes';
import { flushSyncCallbacks, scheduleSyncCallback } from './syncTaskQueue';
import { HostRoot } from './workTags';
import {
	unstable_scheduleCallback as scheduleCallback,
	unstable_NormalPriority as NormalPriority,
	unstable_shouldYield,
	unstable_cancelCallback,
} from 'scheduler';
import { HookHasEffect, Passive } from './hookEffectTags';
import { SuspenseException, getSuspenseThenable } from './thenable';
import { resetHooksOnUnwind } from './fiberHooks';
import { throwException } from './fiberThrow';
import { unwindWork } from './fiberUnwindWork';

let workInProgress: FiberNode | null = null;
let wipRootRenderLane: Lane = NoLane;
let rootDoesHasPassiveEffect: boolean = false;

type RootExitStatus = number; // 当前root阶段退出时的一个状态
const RootInComplete = 1; // 中断
const RootCompleted = 2; // 执行完毕
// 执行过程中报错了

type SuspendedReason = typeof NotSuspended | typeof SuspendedOnData;
const NotSuspended = 0;
const SuspendedOnData = 1;
let wipSuspendedReason: SuspendedReason = NotSuspended;
let wipThrownValue: any = null;

function prepareFreshStack(root: FiberRootNode, lane: Lane) {
	root.finishedLane = NoLane;
	root.finishedWork = null;
	workInProgress = createWorkInProcess(root.current, {});
	wipRootRenderLane = lane;
}
// 找到根节点 调用renderRoot方法
export function scheduleUpdateOnFiber(fiber: FiberNode, lane: Lane) {
	// 调度功能
	const root = markUpdateFromFiberToRoot(fiber);
	markRootUpdated(root, lane);
	ensureRootIsScheduled(root);
}
// 调度阶段入口
export function ensureRootIsScheduled(root: FiberRootNode) {
	const updateLane = getHighestPriorityLane(root.pendingLanes);
	const existingCallback = root.callbackNode;
	if (updateLane === NoLane) {
		if (existingCallback !== null) {
			unstable_cancelCallback(existingCallback);
		}
		root.callbackNode = null;
		root.callbakcPriority = NoLane;
		return;
	}
	const curPriorty = updateLane;
	const prevPriority = root.callbakcPriority;

	if (curPriorty === prevPriority) {
		return;
	}

	if (existingCallback !== null) {
		unstable_cancelCallback(existingCallback);
	}

	let newCallbackNode = null;
	if (__DEV__) {
		console.log(
			`在${updateLane === SyncLane ? '微' : '宏'}任务中调度，优先级`,
			updateLane
		);
	}

	if (updateLane === SyncLane) {
		//同步优先级 用微任务调度
		scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
		scheduleMicroTask(flushSyncCallbacks);
	} else {
		// 其他优先级 用宏任务调度
		const schedulerPriority = lanesToSchedulerPriority(updateLane);
		newCallbackNode = scheduleCallback(
			schedulerPriority,
			//@ts-ignore
			performConcurrentWorkOnRoot.bind(null, root)
		);
	}
	root.callbackNode = newCallbackNode;
	root.callbakcPriority = curPriorty;
}

export function markRootUpdated(root: FiberRootNode, lane: Lane) {
	root.pendingLanes = mergeLanes(root.pendingLanes, lane);
}

export function markUpdateFromFiberToRoot(fiber: FiberNode) {
	// 找到当前节点的根  及 FiberRootNode
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

function performConcurrentWorkOnRoot(
	root: FiberRootNode,
	didTimeout: boolean
): any {
	// 保证useEffect回调执行
	const curCallback = root.callbackNode;
	const didFlashPassiveEffect = flushPassiveEffects(root.pendingPassiveEffects);
	if (didFlashPassiveEffect) {
		if (root.callbackNode !== curCallback) {
			return null;
		}
	}

	const lane = getHighestPriorityLane(root.pendingLanes);
	const curCallbackNode = root.callbackNode;
	if (lane === NoLane) {
		return null;
	}
	const needSync = lane === SyncLane || didTimeout;
	//render 阶段
	const exitStatus = renderRoot(root, lane, !needSync);

	ensureRootIsScheduled(root);

	if (exitStatus === RootInComplete) {
		// 中断
		if (root.callbackNode !== curCallbackNode) {
			return null;
		}
		return performConcurrentWorkOnRoot.bind(null, root);
	}
	if (exitStatus === RootCompleted) {
		const finishedWork = root.current.alternate;
		root.finishedWork = finishedWork;
		root.finishedLane = lane;
		wipRootRenderLane = NoLane;
		// wip
		commitRoot(root);
	} else if (__DEV__) {
		console.error('还未实现并发更新结束状态');
	}
}

function performSyncWorkOnRoot(root: FiberRootNode) {
	const nextLane = root.pendingLanes;

	if (nextLane !== SyncLane) {
		//其他比SyncLane底的优先级
		// Nolane
		ensureRootIsScheduled(root);
		return;
	}

	const exitStatus = renderRoot(root, nextLane, false);
	if (exitStatus === RootCompleted) {
		const finishedWork = root.current.alternate;
		root.finishedWork = finishedWork;
		root.finishedLane = nextLane;
		wipRootRenderLane = NoLane;

		// wip
		commitRoot(root);
	} else if (__DEV__) {
		console.error('还未实现同步更新结束状态');
	}
}

function renderRoot(root: FiberRootNode, lane: Lane, shouldTimeSlice: boolean) {
	if (__DEV__) {
		console.log(`开始${shouldTimeSlice ? '并发' : '同步'}更新`, root);
	}
	if (wipRootRenderLane !== lane) {
		// 初始化 ---》当前workInProgress指向
		prepareFreshStack(root, lane); // 并非每次调用都要初始化 因为存在 中断后又继续的情况，这里我们判断一下 若与当前lane 不同，我们在调用
	}

	do {
		try {
			if (wipSuspendedReason !== NotSuspended && workInProgress !== null) {
				const thrownValue = wipThrownValue;
				wipSuspendedReason = NotSuspended;
				wipThrownValue = null;
				// unwind
				throwAndUnwindWorkLoop(root, workInProgress, thrownValue, lane);
			}

			shouldTimeSlice ? workLoopConcurrent() : workLoopSync();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workLoop发生错误', e);
			}
			// TODO 捕获 unwind阶段
			handleThrow(root, e);
			// workInProgress = null;
		}
	} while (true);
	// 中断执行/render阶段执行完
	if (shouldTimeSlice && workInProgress !== null) {
		return RootInComplete;
	}
	// render阶段执行完
	if (!shouldTimeSlice && workInProgress !== null && __DEV__) {
		console.error(`render阶段结束时wip不应该不是null`);
	}
	// TODO 报错
	return RootCompleted;
}

function throwAndUnwindWorkLoop(
	root: FiberRootNode,
	unitOfWork: FiberNode,
	thrownValue: any,
	lane: Lane
) {
	//重置 FC 全局变量
	resetHooksOnUnwind();
	// 请求返回后重新触发
	throwException(root, thrownValue, lane);
	// unwind
	unwindUnitOfWork(unitOfWork);
}

function unwindUnitOfWork(unitOfWork: FiberNode) {
	let incomplteWork: FiberNode | null = unitOfWork;
	do {
		const next = unwindWork(incomplteWork);
		if (next !== null) {
			workInProgress = next;
			return;
		}

		const returnFiber = incomplteWork.return as FiberNode;
		if (returnFiber !== null) {
			//
			returnFiber.deletions = null;
		}
		incomplteWork = returnFiber;
	} while (incomplteWork !== null);
	// 使用了use  抛出了data 但是没有定义suspense
	// 到了root
	workInProgress = null;
}

function handleThrow(root: FiberRootNode, thrownValue: any) {
	// Error Boundary
	if (thrownValue === SuspenseException) {
		thrownValue = getSuspenseThenable();
		wipSuspendedReason = SuspendedOnData;
	}
	wipThrownValue = thrownValue;
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;
	if (finishedWork === null) {
		return;
	}
	if (__DEV__) {
		console.log('commit阶段开始', finishedWork);
	}
	const lane = root.finishedLane;
	if (lane === NoLane && __DEV__) {
		console.error('commit阶段finishedLane不应该是Nolane');
	}
	// 重置
	root.finishedWork = null;
	root.finishedLane = NoLane;

	markRootFinished(root, lane);

	if (
		(finishedWork.flags & PassiveMask) !== NoFlags ||
		(finishedWork.subtreeFlags & PassiveMask) !== NoFlags
	) {
		if (!rootDoesHasPassiveEffect) {
			rootDoesHasPassiveEffect = true;
			//调度副作用
			scheduleCallback(NormalPriority, () => {
				//执行副作用
				flushPassiveEffects(root.pendingPassiveEffects);
				return;
			});
		}
	}

	// 判断是否存在三个子阶段需要执行的操作
	// root flags root subtreeFlags
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// beforeMutation
		// mutation Placement
		commitMutationEffects(finishedWork, root);
		// Fiber Tree切换
		root.current = finishedWork;
		// Layout
		commitLayoutEffects(finishedWork, root);
	} else {
		root.current = finishedWork;
	}
	rootDoesHasPassiveEffect = false;
	ensureRootIsScheduled(root);
}

function workLoopSync() {
	while (workInProgress !== null) {
		performUnitOfWork(workInProgress);
	}
}

function workLoopConcurrent() {
	while (workInProgress !== null && !unstable_shouldYield()) {
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	const next = beginWork(fiber, wipRootRenderLane);
	fiber.memoizedProps = fiber.pendingProps; // 为什么搞一个memoizedProps
	if (next === null) {
		completeUnitOfWork(fiber);
	} else {
		workInProgress = next;
	}
}

function flushPassiveEffects(pendingPassiveEffects: PendingPassiveEffects) {
	// 判断当前是否有回调
	let didFlashPassiveEffect = false;

	pendingPassiveEffects.unmount.forEach((effect) => {
		didFlashPassiveEffect = true;
		commitHookEffectListUnmount(Passive, effect);
	});
	pendingPassiveEffects.unmount = [];

	pendingPassiveEffects.update.forEach((effect) => {
		didFlashPassiveEffect = true;
		commitHookEffectListDestory(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update.forEach((effect) => {
		didFlashPassiveEffect = true;
		commitHookEffectListCreate(Passive | HookHasEffect, effect);
	});
	pendingPassiveEffects.update = [];
	flushSyncCallbacks();
	return didFlashPassiveEffect;
}

function completeUnitOfWork(fiber: FiberNode) {
	// 没有子节点 遍历兄弟节点
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			workInProgress = sibling;
			return;
		}
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}

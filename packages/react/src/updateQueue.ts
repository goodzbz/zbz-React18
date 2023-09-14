import { Dispatch } from 'react/src/currentDispatcher';
import type { Action } from 'shared/ReactTypes';

export interface Update<State> {
	action: Action<State>;
}
export interface UpdateQueue<State> {
	shared: {
		pending: Update<State> | null;
	};
	dispatch: Dispatch<State> | null;
}
// 创建更新操作
export const createUpdate = <State>(action: Action<State>): Update<State> => {
	return {
		action,
	};
};
export const createUpdateQueue = <State>() => {
	// 创建更新队列
	return {
		shared: {
			pending: null,
		},
		dispatch: null,
	} as UpdateQueue<State>;
};

// 添加更新操作
export const enqueueUpdate = <State>(
	updateQueue: UpdateQueue<State>,
	update: Update<State>
) => {
	updateQueue.shared.pending = update;
};
//消费更新操作
export const processUpdataQueue = <State>(
	baseState: State,
	pendingUpdate: Update<State> | null
): { memoizedState: State } => {
	const result: ReturnType<typeof processUpdataQueue<State>> = {
		memoizedState: baseState,
	};
	if (pendingUpdate !== null) {
		const action = pendingUpdate.action;
		if (action instanceof Function) {
			result.memoizedState = action(baseState);
		} else {
			result.memoizedState = action;
		}
	}
	return result;
};
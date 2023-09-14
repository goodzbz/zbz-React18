import { jsx, jsxDEV, isValidElement as isValidElementFn } from './src/jsx';
import currentDispatcher, {
	Dispatcher,
	resolveDispatcher,
} from './src/currentDispatcher';
export const useState: Dispatcher['useState'] = (initialState: any) => {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initialState);
};

// 内部数据共享层
export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
	currentDispatcher,
};

export const isValidElement = isValidElementFn;
export const version = '0.0.0';
export const createElement = jsx;

import { FiberNode } from './fiber';
import { popProvider } from './fiberContext';
import { DidCaputure, NoFlags, ShouldCaputure } from './fiberFlags';
import { popSuspenseHandler } from './suspenseContext';
import { ContextProvider, SuspenseComponent } from './workTags';

export function unwindWork(wip: FiberNode) {
	const flags = wip.flags;
	switch (wip.tag) {
		case SuspenseComponent:
			popSuspenseHandler();
			if (
				(flags & ShouldCaputure) !== NoFlags &&
				(flags & DidCaputure) === NoFlags
			) {
				wip.flags = (flags & ~ShouldCaputure) | DidCaputure;
				return wip;
			}
			break;
		case ContextProvider:
			const context = wip.type._context;
			popProvider(context);
			return null;
		default:
			return null;
	}
	return null;
}

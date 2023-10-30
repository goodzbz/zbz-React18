import { FiberNode } from 'react-reconciler/src/fiber';
import { HostComponent, HostText } from 'react-reconciler/src/workTags';
import { DOMElement, updateFiberProps } from './SyntheticEvent';
import { Props } from 'shared/ReactTypes';
import { flushSyncCallbacks } from 'react-reconciler/src/syncTaskQueue';

export type Container = any;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string, props: Props) => {
	const element = document.createElement(type) as unknown;
	updateFiberProps(element as DOMElement, props);
	return element;
};

export const appendInitialChild = (
	parent: Instance | Container,
	child: Instance
) => {
	parent.appendChild(child);
	console.log(parent);
};
export const createTextInstance = (content: string) => {
	return document.createTextNode(content);
};
export const appendChildToContainer = (
	parent: Instance | Container,
	child: Instance
) => {
	child.appendChild(parent);
	console.log(parent);
};

export function commitUpdate(fiber: FiberNode) {
	switch (fiber.tag) {
		case HostText:
			const text = fiber.memoizedProps?.content;
			return commitTextUpdate(fiber.stateNode, text);
		case HostComponent:
			break;
		default:
			if (__DEV__) {
				console.warn('未实现的Update类型', fiber);
			}
			break;
	}
}

export function commitTextUpdate(textInstance: TextInstance, content: string) {
	textInstance.textContent = content;
}

export function removeChild(
	child: Instance | TextInstance,
	container: Container
) {
	container.removeChild(child);
}

export function insertChildToContainer(
	child: Instance,
	container: Container,
	before: Instance
) {
	container.insertBefore(child, before);
}

export const scheduleMicroTask =
	typeof queueMicrotask === 'function'
		? queueMicrotask
		: typeof Promise === 'function'
		? (callback: (...arg: any) => void) => Promise.resolve(null).then(callback)
		: setTimeout;

export function hideInstance(instance: Instance) {
	const style = (instance as HTMLElement).style;
	style.setProperty('display', 'none', 'important');
}

export function unhideInstance(instance: Instance) {
	const style = (instance as HTMLElement).style;
	style.display = '';
}

export function hideTextIntance(textInstance: TextInstance) {
	textInstance.nodeValue = '';
}

export function unhideTextInstance(textInstance: TextInstance, text: string) {
	textInstance.nodeValue = text;
}

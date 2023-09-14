import { FiberNode } from 'react-reconciler/src/fiber';
import { HostText } from 'react-reconciler/src/workTags';

export type Container = any;
export type Instance = Element;
export type TextInstance = Text;

export const createInstance = (type: string) => {
	const element = document.createElement(type);
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
			const text = fiber.memoizedProps.content;
			return commitTextUpdate(fiber.stateNode, text);
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

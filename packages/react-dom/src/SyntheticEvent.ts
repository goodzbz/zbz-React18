import { Container } from 'hostConfig';
import { Props } from 'shared/ReactTypes';

export const elementPropsKey = '__props';
const validEventTypeList = ['click'];

export interface DOMElement extends Element {
	[elementPropsKey]: Props;
}

interface SyntheticEvent extends Event {
	__stopPropagation: boolean;
}

type EventCallback = (e: Event) => void;

interface Paths {
	capture: EventCallback[];
	bubble: EventCallback[];
}

export function updateFiberProps(node: DOMElement, props: Props) {
	node[elementPropsKey] = props;
}
// 一个典型的事件代理

export function initEvent(container: Container, eventType: string) {
	if (!validEventTypeList.includes(eventType)) {
		console.warn('当前不支持', eventType, '事件');
		return;
	}
	if (__DEV__) {
		console.log('初始化事件:', eventType);
	}
	container.addEventListener(eventType, (e: Event) => {
		dispatchEvent(container, eventType, e);
	});
}

function createSyntheticEvent(e: Event) {
	const SyntheticEvent = e as SyntheticEvent;
	SyntheticEvent.__stopPropagation = false;
	const originStopPropagation = e.stopPropagation;
	SyntheticEvent.stopPropagation = () => {
		SyntheticEvent.__stopPropagation = true;
		if (originStopPropagation) {
			originStopPropagation();
		}
	};
	return SyntheticEvent;
}

function dispatchEvent(container: Container, eventType: string, e: Event) {
	const targetElement = e.target;
	if (targetElement === null) {
		console.warn('事件不存在target', e);
		return;
	}
	//收集沿途的事件
	const { bubble, capture } = collectPaths(
		targetElement as DOMElement,
		container,
		eventType
	);
	//构造合成事件
	const se = createSyntheticEvent(e);
	// 遍历capture
	triggerEventFlow(capture, se);
	if (!se.__stopPropagation) {
		// 遍历bubble
		triggerEventFlow(bubble, se);
	}
}

function triggerEventFlow(paths: EventCallback[], se: SyntheticEvent) {
	for (let i = 0; i < paths.length; i++) {
		const callback = paths[i];
		callback.call(null, se);
		if (se.__stopPropagation) {
			break;
		}
	}
}
// 统一处理所有click 和 clickCaputure所控制的事件  捕获阶段调用层级高的 冒泡阶段只调用层级低的， 这里的捕获和冒泡分别对应的是不同的事件 请分开来理解，他并不是一个事件的两个流程 而是两个事件

function getEventCallbackNameFromEventType(eventType: string) {
	return {
		click: ['onClickCapture', 'onClick'],
	}[eventType];
}

function collectPaths(
	targetElement: DOMElement,
	container: Container,
	eventType: string
) {
	const paths: Paths = {
		capture: [],
		bubble: [],
	};
	while (targetElement && targetElement !== container) {
		//收集
		const elementProps = targetElement[elementPropsKey];
		if (elementProps) {
			const callbackNameList = getEventCallbackNameFromEventType(eventType);
			if (callbackNameList) {
				callbackNameList.forEach((callbackName, i) => {
					const eventCallback = elementProps[callbackName];
					if (eventCallback) {
						if (i == 0) {
							paths.capture.unshift(eventCallback);
						} else {
							paths.bubble.push(eventCallback);
						}
					}
				});
			}
		}

		targetElement = targetElement.parentNode as DOMElement;
	}
	return paths;
}

// react18的事件系统是一个怎样的架构思路
//   事件代理*
//  使用方法一定还是 希望在节点中通过标签去使事件可以产生生效 避免手动监听
//  缺少的手动监听该怎么实现呢
//  我们要实现的是事件的触发，及点击之后事件可以正确的被触发
//  那我改在什么时候触发这些函数  当click事件发生的时候 （在根节点可以监听doc  找到被触发的节点）
//  因为公用一个根节点  所以我只需要拿到当前事件触发的位置 然后往上遍历 就可以得到沿途中被触发的节点

//   问题的关键在  1. 拿到要被触发的事件  2.代理  doc根代理 事件发生 就能获取到target 通过target拿到沿途中被调用的方法

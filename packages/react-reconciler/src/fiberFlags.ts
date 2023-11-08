// reconciler操作标记
export type Flags = number;
export const NoFlags = 0b00000000000000000000000000;
export const Placement = 0b00000000000000000000000010;
export const Update = 0b00000000000000000000000100;
export const ChildDeletion = 0b00000000000000000000010000;
// useEffect
export const PassiveEffect = 0b00000000000000000000100000; // fiber本次更新存在副作用
export const Ref = 0b00000000000000000001000000;
export const Visibility = 0b00000000000000000010000000;

export const DidCaputure = 0b00000000000000000010000000;

//render阶段 捕获到一些东西
export const ShouldCaputure = 0b00000000000000000100000000;

export const MutationMask =
	Placement | Update | ChildDeletion | Ref | Visibility;

export const LayoutMask = Ref;

export const PassiveMask = PassiveEffect | ChildDeletion;

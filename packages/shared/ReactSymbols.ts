// $$typeof是独一无二的值，所以我们这里使用Symbols
const supportSymbol = typeof Symbol === 'function' && Symbol;
export const REACT_ELEMENT_TYPE = supportSymbol
	? Symbol.for('react.element')
	: 0xeac7;

export const REACT_FRAGMENT_TYPE = supportSymbol
	? Symbol.for('react.fragment')
	: 0xeacb;

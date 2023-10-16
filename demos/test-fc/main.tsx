import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom';
console.log(ReactDOM);
function App() {
	const [num, setNum] = useState(100);
	// setNum(100); re-render  render时期渲染是要报错的
	console.log(1);
	const arr = [<li>1</li>, <li>2</li>, <li>3</li>];
	return (
		<ul>
			<>
				<li>1</li>
				<li>2</li>
			</>
			{arr}
			<li>4</li>
		</ul>
	);
}
function Children() {
	return (
		<>
			<span>big-react</span>
			<span>big-react</span>
		</>
	);
}

ReactDOM.createRoot(document.querySelector('#root') as HTMLElement).render(
	<App />
);

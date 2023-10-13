import React from 'react';
import ReactDOM from 'react-dom';

// const jsx = (
// 	<div>
// 		<span>big-react</span>
// 	</div>
// );
function App() {
	const [num, setNum] = React.useState(0);
	// setNum(100); re-render  render时期渲染是要报错的
	console.log(1);
	const arr =
		num % 2 === 0
			? [<li>1</li>, <li>2</li>, <li>3</li>]
			: [<li>3</li>, <li>2</li>, <li>1</li>];
	console.log(arr);
	return (
		<div
			onClick={(e) => {
				console.log(e.target);
				setNum(num + 1);
			}}
		>
			{arr.map((element) => {
				return element;
			})}
		</div>
	);
}
const root = document.querySelector('#root');
ReactDOM.createRoot(root).render(<App />);
// console.log(React);
// console.log('children', Children);

// console.log(ReactDOM);

import React from 'react';
import ReactDOM from 'react-dom';

// const jsx = (
// 	<div>
// 		<span>big-react</span>
// 	</div>
// );
function App() {
	const [num, setNum] = React.useState(100);
	// setNum(100); re-render  render时期渲染是要报错的
	console.log(1);
	return (
		<div
			onClick={(e) => {
				console.log(e.target);
			}}
		>
			<span
				onClick={(e) => {
					console.log(e.target);
				}}
			>
				this is a span
			</span>
		</div>
	);
}
const root = document.querySelector('#root');
ReactDOM.createRoot(root).render(<App />);
// console.log(React);
// console.log('children', Children);

// console.log(ReactDOM);

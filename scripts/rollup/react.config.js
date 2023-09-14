import { getPackageJSON, resolvePkgPath, getBaseRollupPlugins } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';

const { name, module } = getPackageJSON('react');
//react包的路径
const pkgPath = resolvePkgPath(name);
const pkgDistPath = resolvePkgPath(name, true);

export default [
	//react 我们希望有三个包 分别对应dev环境 pprod环境 和React
	{
		input: `${pkgPath}/${module}`,
		output: {
			file: `${pkgDistPath}/index.js`,
			name: 'React',
			format: 'umd', //支持esm & cjs
		},
		plugins: [
			...getBaseRollupPlugins(),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					main: 'index.js',
				}),
			}),
		],
	},
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: [
			{
				// jsx-runtime
				file: `${pkgDistPath}/jsx-runtime.js`,
				name: 'jsx-runtime',
				format: 'umd', //支持esm & cjs
			},
			{
				// jsx-dev-runtime
				file: `${pkgDistPath}/jsx-dev-runtime.js`,
				name: 'jsx-dev-runtime',
				format: 'umd', //支持esm & cjs
			},
		],
		plugins: [getBaseRollupPlugins()],
	},
];

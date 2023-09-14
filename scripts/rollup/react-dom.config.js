import { getPackageJSON, resolvePkgPath, getBaseRollupPlugins } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';
const { name, module, peerDependencies } = getPackageJSON('react-dom');
//react-dom 包的路径
const pkgPath = resolvePkgPath(name);
//reactDom的产物路径
const pkgDistPath = resolvePkgPath(name, true);

export default [
	//react-dom
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/index.js`,
				name: 'ReactDOM',
				format: 'umd', //支持esm & cjs
			},
			{
				file: `${pkgDistPath}/client.js`,
				name: 'client',
				format: 'umd', //支持esm & cjs
			},
		],
		external: [
			//打包时不要把外部的包打入到内部
			...Object.keys(peerDependencies),
		],
		plugins: [
			...getBaseRollupPlugins(),
			// alias  插件
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig`,
				},
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: pkgDistPath,
				baseContents: ({ name, description, version }) => ({
					name,
					description,
					version,
					peerDependencies: {
						react: version,
					},
					main: 'index.js',
				}),
			}),
		],
	},
	//react-test-utils
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${pkgDistPath}/test-utils.js`,
				name: 'testUtils.js',
				format: 'umd', //支持esm & cjs
			},
		],
		external: [
			//打包时不要把外部的包打入到内部
			'react-dom',
			'react',
		],
		plugins: getBaseRollupPlugins(),
	},
];

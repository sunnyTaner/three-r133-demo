/**
 * @Author :TanShiJun 1826356125@qq.com
 * @Date :2022/6/20
 * @Describe :
 * Last Modified by : TSJ
 * Last Modified time :2022/6/20
 **/
'use strict';

THREE.StretchShader = {

	uniforms: {
		"sw" : {type:'b', value : false},
		"mvpMatrix" : {type:'m4',value:new THREE.Matrix4()}
	},

	//
	vertexShader: `
        uniform mat4 mvpMatrix;
        uniform bool sw;
        void main() {
        	// gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        	gl_Position = mvpMatrix * vec4( position, 1.0 );
            // if(sw) {
            // 				  // 模型视图投影矩阵 传入的
            //     gl_Position = mvpMatrix * vec4( position, 1.0 );
            // }else{
            // 				  // projectionMatrix * modelViewMatrix 计算模型视图投影矩阵，内部计算
            //     gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            // }
        }`
	,

	//
	fragmentShader: `
        uniform bool sw;
        void main() {
            if(sw) {
                gl_FragColor = vec4(0.556, 0.0, 0.0, 1.0);
            }else {
                gl_FragColor = vec4(0.556, 0.8945, 0.9296, 1.0);
            }
        }`
};


function init() {
	//console.log("Using Three.js version: " + THREE.REVISION);

	// create a scene, that will hold all our elements such as objects, cameras and lights.
	var scene = new THREE.Scene();

	// create a camera, which defines where we're looking at.
	var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

	// position and point the camera to the center of the scene
	camera.position.set(0, 0, 100);   //相机的位置
	camera.up.set(0, 1, 0);         //相机以哪个方向为上方
	camera.lookAt(new THREE.Vector3(1, 2, 3));          //相机看向哪个坐标

	// create a render and set the size
	var renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(new THREE.Color(0x000000));
	renderer.setSize(window.innerWidth, window.innerHeight);

	// add the output of the renderer to the html element
	document.getElementById("webgl-output").appendChild(renderer.domElement);


	// create the ground plane
	var planeGeometry = new THREE.PlaneGeometry(60, 20);
	// var planeMaterial = new THREE.MeshBasicMaterial({
	//     color: 0xAAAAAA
	// });

	var planeMaterial = new THREE.ShaderMaterial({
		uniforms: THREE.StretchShader.uniforms,
		vertexShader: THREE.StretchShader.vertexShader,
		fragmentShader: THREE.StretchShader.fragmentShader
	});

	var plane = new THREE.Mesh(planeGeometry, planeMaterial);

	// add the plane to the scene
	scene.add(plane);

	// rotate and position the plane
	plane.position.set(15, 8, -10);
	plane.rotation.x = THREE.Math.degToRad(30);
	plane.rotation.y = THREE.Math.degToRad(45);
	plane.rotation.z = THREE.Math.degToRad(60);

	render();

	var farmeCount = 0;
	function render() {

		var mvpMatrix = new THREE.Matrix4();
		mvpMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
		mvpMatrix.multiplyMatrices(mvpMatrix, plane.matrixWorld);

		THREE.StretchShader.uniforms.mvpMatrix.value = mvpMatrix;
		if(farmeCount % 60 === 0){
			THREE.StretchShader.uniforms.sw.value = !THREE.StretchShader.uniforms.sw.value;
		}

		farmeCount = requestAnimationFrame(render);
		renderer.render(scene, camera);
	}

}

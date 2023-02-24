/**
 * @Author :TanShiJun 1826356125@qq.com
 * @Date :2022/6/22
 * @Describe :
 * Last Modified by : TSJ
 * Last Modified time :2022/6/22
 **/
import{
	Vector3,
	Box3,
	Mesh,
} from '../../build/three.module.js'


/**
 * 使用方法：
 * 1、调用setSplitModel函数将要拆分的模型传入预处理
 * 然后两种控制爆炸方式
 * （1）实时更新
 *      调用startSplit()/quitSplit()函数开始爆炸/恢复
 *      需要在three的animate函数中调用update函数
 * （2）滑动条
 *      调用setValue函数把滑动条的值传入。
 */
export class ModelSplit{
	constructor(){
		this.meshList = [];
		this.running = false;
		this.targetSplitValue = 0;
		this.currentSplitValue = 0;
		this.offset = 1;

		this.splitScale = 5; //影响拆分距离，就是mesh的包围盒中心与爆炸中心的距离的倍率
		this.splitSpeed = 100;//影响拆分速度，反比例

		this.mode = 1;
		if(this.mode == 2){
			this.splitScale = 0.3; //影响拆分距离，就是mesh的包围盒中心与爆炸中心的距离的倍率
			this.splitSpeed = 50;//影响拆分速度，反比例
		}
	}

	setSplitModel(model){
		if(!model || model instanceof Mesh) {
			console.warn("只能处理Scene、Object3D、Group")
			return;
		}
		this.quit();
		this.meshList = [];

		//计算模型整体包围盒中心作为爆炸中心
		model.updateMatrixWorld();



		var box = new Box3().expandByObject(model);
		var maxLength = box.max.clone().distanceTo(box.min);
		var center;
		if(this.mode == 1){
			center = box.getCenter(new Vector3());
		}
		else{  //爆炸中心由子mesh的包围盒中心决定
			center = new Vector3();
			var subBox,subCenter,count = 0;;
			model.traverse(node=>{
				if(node.type == "Mesh"){
					//分别计算每个mesh的包围盒中心，其与爆炸中心连线作为爆炸方向
					subBox = new Box3().expandByObject(node);
					subCenter = subBox.getCenter(new Vector3());
					center = center.clone().add(subCenter);
					count++;
				}
			})
			// 计算所有叶子节点包围盒中心点组合后的中心点
			center = center.clone().multiplyScalar(1/count);
		}

		model.traverse(node=>{
			if(node.type == "Mesh"){
				debugger
				//分别计算每个mesh的包围盒中心，其与爆炸中心连线作为爆炸方向
				let subBox = new Box3().expandByObject(node);
				let meshCenter = subBox.getCenter(new Vector3());
				// 注意世界坐标和本地坐标不一样mesh.position获得是本地坐标
				node._splitSrcPos = node.getWorldPosition(new Vector3())

				// 测试本地坐标 和世界坐标 得出规律 节点世界坐标=节点本地坐标 X 父节点世界矩阵
				// console.log("mesh_position_world",node._splitSrcPos)
				// let parentMatrixWd=node.parent.matrixWorld.clone()
				// let position=new Vector3().copy(node.position)
				// console.log("position",position)
				// let position_jsh=position.applyMatrix4(parentMatrixWd)
				// console.log("position_jsh",position_jsh)


				let subSpeed;
				if(this.mode == 1){
					subSpeed = {
						x:(meshCenter.x-center.x) * this.splitScale / this.splitSpeed,
						y:(meshCenter.y-center.y) * this.splitScale / this.splitSpeed,
						z:(meshCenter.z-center.z) * this.splitScale / this.splitSpeed,
					}
				}
				else{
					let targetPos = meshCenter.clone().add(meshCenter.clone().sub(center).normalize().multiplyScalar(maxLength));
					//这里计算各个轴向分速度，这样可以使用滑动条控制进度
					subSpeed = {
						x:(targetPos.x - center.x) * this.splitScale / this.splitSpeed,
						y:(targetPos.y - center.y) * this.splitScale / this.splitSpeed,
						z:(targetPos.z - center.z) * this.splitScale / this.splitSpeed,
						// x:(meshCenter.x-center.x) * this.splitScale / this.splitSpeed,
						// y:(meshCenter.y-center.y) * this.splitScale / this.splitSpeed,
						// z:(meshCenter.z-center.z) * this.splitScale / this.splitSpeed,
					}
				}

				node._splitSpeed = subSpeed;
				this.meshList.push(node);
			}
		})
		this.currentSplitValue = 0;
		this.targetSplitValue = 0;
		this.running = false;
	}

	/**
	 * 开始爆炸
	 */
	startSplit(){
		this.targetSplitValue = this.splitSpeed;
		this.currentSplitValue = 0;
		this.offset = 1;
		this.running = true;
		this.isQuit = false;
	}

	/**
	 * 开始反向爆炸（还原）
	 */
	quitSplit(){
		this.targetSplitValue = 0;
		this.currentSplitValue = this.splitSpeed;
		this.offset = -1;
		this.running = true;
		this.isQuit = true;
	}

	/**
	 * 退出拆分时还原
	 */
	quit(){
		if(this.currentSplitValue != 0 && this.meshList.length > 0){
			for(var i=0;i<this.meshList.length;i++){
				let node = this.meshList[i];
				node.position.copy(node._splitSrcPos);
			}
			this.currentSplitValue = 0;
			this.targetSplitValue = 0;
		}
	}

	/**
	 * 如果用滑动条控制时将滑动条的值传入这个函数
	 * @param {*} value [0,1]的值，表示爆炸进度
	 */
	setValue(value){
		if(value < 0) value = 0;
		if(value > 1) value = 1;
		this.currentSplitValue = value * this.splitSpeed;
		for(var i=0;i<this.meshList.length;i++){
			let node = this.meshList[i];
			let x = node._splitSpeed.x * this.currentSplitValue + node._splitSrcPos.x;
			let y = node._splitSpeed.y * this.currentSplitValue + node._splitSrcPos.y;
			let z = node._splitSpeed.z * this.currentSplitValue + node._splitSrcPos.z;
			node.parent.updateMatrixWorld();
			// 还原回本地坐标
			let invMat = node.parent.matrixWorld.clone().invert();
			let pos = new Vector3(x,y,z).applyMatrix4(invMat);
			node.position.copy(pos);
		}
	}

	/**
	 * 更新
	 * @returns
	 */
	update(){
		if(this.running && this.meshList.length > 0){

			if (this.currentSplitValue != this.targetSplitValue) {
				this.currentSplitValue += this.offset;
			}

			for(var i=0;i<this.meshList.length;i++){
				let node = this.meshList[i];
				let x = node._splitSpeed.x * this.currentSplitValue + node._splitSrcPos.x;
				let y = node._splitSpeed.y * this.currentSplitValue + node._splitSrcPos.y;
				let z = node._splitSpeed.z * this.currentSplitValue + node._splitSrcPos.z;
				node.parent.updateMatrixWorld();

				// 获取逆矩阵
				let invMat = node.parent.matrixWorld.clone().invert();

				//一个对象的本地矩阵.materix包含了该对象的旋转、平移和缩放变换，本地矩阵是平移矩阵、缩放矩阵和旋转矩阵的乘积。

				// 一个对象的世界矩阵.matrixWorld是该对象本地矩阵及其所有所有祖宗对象本地矩阵的乘积，
				// 或者每一个对象的世界矩阵是对象本地矩阵和父对象的世界矩阵的乘积。



				// 我目前的理解是 求出x,y,z创建的向量是在世界坐标系下，需要转换为本地坐标系才行
				// 反向求出该叶子节点的本地坐标位置
				// 节点世界坐标=节点本地坐标 X 父节点世界矩阵
				// 反求 本地坐标=节点世界坐标 X 父节点世界逆矩阵
				let pos = new Vector3(x,y,z).applyMatrix4(invMat);

				node.position.copy(pos);
			}

			if(this.currentSplitValue === this.targetSplitValue){
				this.running = false;

				if(this.isQuit === true){
					this.quit();
					this.isQuit = false;
				}
			}
		}
	}
}


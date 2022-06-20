# 1、什么是shader
所谓shader中文叫做着色器，它实际上是给用户一种方式来介入GPU渲染流程，定制gpu如何组织数据和绘制数据到屏幕上

# 2、顶点着色器 Vertex Shader
顶点着色器主要负责处理顶点数据，其实顶点着色器能做的事情并不多，大部分就是在处理顶点的矩阵变换，将顶点的位置通过MVP矩阵乘法最终变换到裁剪空间

__输入__：顶点着色器的输入数据一般是我们传入的attribute、uniforms变量。

__输出__：一般顶点着色器的运算结果输出是设置gl_Position，也可以设置一些变量比如gl_PointSize或者 varying变量

#3、片元着色器fragment Shader
片元着色器在整个渲染中起到了非常大的作用，一般颜色，贴图采样，光照，阴影等计算都会在片元着色器中计算。

输入：片元着色器的输入数据一般是我们从顶点着色器传入的varying或者全局的uniforms变量。

输出：一般片元着色器的运算结果输出是设置gl_FragColor

#4、shader是如何运行的
想要了解shader是如何运行的，我们就要先知道整个webgl的运行机制。webgl的一次绘制，需要经过大致的以下几个阶段。

- 创建webgl的应用程序Program，从文本编译并使用shader
- 将三维几何数据通过attribute传送给GPU
- GPU执行顶点着色器，处理顶点数据
- GPU执行片元着色器，处理颜色等数据
- 将执行结果写入缓冲区（用于显示到屏幕或者后处理）
- 我们可以看到，shader的执行是需要链接、编译后执行的，所以shader在运行时其实本身是不能修改的，但是我们可以修改一些数据参数值。
# 5、如何在threejs中编写shader
ok了解完了基本的一些基础概念后，我们来从一个例子里面，讲讲如何实际使用shader。由于threejs已经帮我们完成了很多基础的框架操作，我们只需要把精力专注在shader程序本身就好。

首先是shader存放的位置，我们可以将shader写成单独的文件，或者在js代码中使用字符串的形式，或者使用html页面中。我们本次演示的是html直接标签包含的形式

第一步，在html的页面中加入以上两个shader的script标签。

```html
<script id="vertexShader" type="x-shader/x-vertex">

    precision mediump float;
    precision mediump int;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    attribute vec3 position;

    varying vec3 vPosition;

    void main() {

        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }

</script>
<script id="fragmentShader" type="x-shader/x-fragment">

    precision mediump float;
    precision mediump int;

    uniform float ratio;

    varying vec3 vPosition;

    void main() {
        vec3 center = vec3( 0.0,0.0,0.0 );
        float dist=  distance(vPosition,center)/100.0; 
        dist = clamp(dist,0.0,1.0); 
        float color = 1.0-dist ; 
        gl_FragColor =  vec4( color*ratio, color*ratio,0.0,dist );

    }

</script>
```
shader本身的代码量非常少，只做简单的demo用。后面我们会讲解里面具体的内容。我们先继续整个流程

第二步，在我们的js代码中使用threejs的RawShaderMaterial来创建一个shader材质。并将html标签中的内容获取赋值给vertexShader,fragmentShader。同时，我们创建了一个uniform 名叫ratio。

```javascript
const material = new THREE.RawShaderMaterial({ 
    uniforms: {
        ratio: {
            value: 0.0
        }
    },
    vertexShader: document.getElementById('vertexShader').textContent,
    fragmentShader: document.getElementById('fragmentShader').textContent, 
});
```
最后一步，我们把这个材质放在一个平面上，并在主循环中更新uniform的值

```javascript
const plane = new THREE.Mesh(geometry, material);
plane.rotateX(-Math.PI / 2); 
scene.add(plane);

let next = 0;
const animate = function () {
    requestAnimationFrame(animate);
    next = next + 0.01;
    if (next > 1)
        next = 0;
    plane.material.uniforms.ratio.value = next;
    renderer.render(scene, camera);
};
```

#6、精度声明
在webgl的shader中，我们可以在第一行使用precision关键字进行精度设置。声明变量精度高低的三个关键子lowp、mediump和highp。注意不同的shader里面有默认值，如果不指定或者指定错误，会导致编译报错

__顶点着色器默认精度__
```
precision highp float;
precision highp int;
precision lowp sampler2D;
precision lowp samplerCube;
```

__片元着色器默认精度__
```
precision mediump int;
precision lowp sampler2D;
precision lowp samplerCube;
```
#7、变量声明
shader中的变量，一般分为三大类，分别是attribute、uniform、varying，他们具体不同的使用场景。

attribute 只能在顶点着色器中出现，且赋值的操作一般是由webgl组织数据的时候就已经绑定好了。attribute是用来向顶点着色器传输几何顶点数据的一般来说。

uniform 可以在顶点或者片元着色器中使用。但是uniform的值是只读的，不可以修改它的值，一般用来传递一些全局参数，比如mvp的矩阵等。

varying 的作用是将顶点着色器中的数据传递给片元着色器。这里的数据一般是一些顶点相关的属性，比如每个顶点的颜色。注意varying在传值的时候，会被gpu插值，所以到片元着色器的时候，值与原先的值不一定完全一致。

##glsl预定义的变量 
预定义变量可以直接使用
- gl_Position 

   用于vertex shader, 写顶点位置；被图元收集、裁剪等固定操作功能所使用；其内部声明是：highp vec4 gl_Position
    
- gl_FragColor 

- gl_FragData
    
     用于Fragment shader，是个数组，写gl_FragData[n] 为data n， gl_FragColor和gl_FragData是互斥的，不会同时写入
- gl_FragCoord

    用于Fragment shader,只读， Fragment相对于窗口的坐标位置 x,y,z,1/w; 这个是固定管线图元差值后产生的；z 是深度值; mediump vec4 gl_FragCoord
- gl_PointSize 

    用于vertex shader, 写光栅化后的点大小，像素个数
    
- gl_FrontFacing
   
   用于判断 fragment是否属于 front-facing primitive；只读
   
- gl_PointCoord
       
   仅用于 point primitive; mediump vec2 gl_PointCoord
   
- normalMatrix 法线矩阵
- 

#8、程序内容
shader中有一个主函数，类似C语言。一般形式是
```
void main() {}
```
程序会从主入口开始执行，直到里面的所有代码全部执行完毕。

我们可以看到，示例中的顶点着色器主函数其实只有两句话，第一句是vPosition = position;表示将attribute的值赋值给varying用来传递给片元着色器。另外一句是gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );这句的作用是，通过矩阵运算，计算当前顶点在裁剪空间坐标点。

片元着色器中，其实也没有几句代码，我们大致讲解一下。我们首先定义了一个圆心vec3 center = vec3( 0.0,0.0,0.0 ); ；然后通过内置的distance函数计算当前顶点位置到圆心的距离float dist= distance(vPosition,center)/100.0;，并转化为（0-1）的区间dist = clamp(dist,0.0,1.0);；我们使用float color = 1.0-dist ;创建一个颜色值，约靠近圆心颜色越深。最后使用gl_FragColor = vec4( color*ratio, color*ratio,0.0,dist );给当前顶点着色输出。

通过代码分析，我们可以看到，其实shader的作用对象，都是非常微观的顶点，这是由于gpu并行运算的原因。所以，我们并不能知道顶点之间的关系。记住这点，我们在写shader的时候要时刻明白自己操作的对象，否则很容易陷入逻辑误区。

以上就是我对threejs中使用shader的一些概念总结，希望对新学习webgl的同学有些帮助。当你理解完shader后，就可以进入其他其他的世界（比如后处理）进行探索。由于这部分内容已经涉及一些webgl原生底层概念，内容比较多，知识点关联性有点大，所以很难一次讲清楚。希望以后有时间可以继续补全。






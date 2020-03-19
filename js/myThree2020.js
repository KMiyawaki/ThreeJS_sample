/**
 * @fileOverview Three.js で簡単なブラウザアプリを作るユーティリティ。
 * @author K.Miyawaki
 */

/**
 * 演習用関数群の名前空間
 * @namespace
 */
var mylib2020 = mylib2020 || {};

/**
 * 物体前方を表すベクトル。
 * @type {THREE.Vector3}
 */
mylib2020.FORWARD = new THREE.Vector3(0, 0, 1);

/**
 * 物体後方を表すベクトル。
 * @type {THREE.Vector3}
 */
mylib2020.BACK = new THREE.Vector3(0, 0, -1);

mylib2020.createRectSize = function (x, y, w, h) {
    return { x: x, y: y, width: w, height: h };
};

mylib2020.calcScreenSize = function (aspect, viewPortWidth, viewPortHeight) {
    let w = viewPortWidth
    let h = viewPortHeight;
    if (h * aspect > w) {
        h = w / aspect;
    } else {
        w = h * aspect;
    }
    return mylib2020.createRectSize(0, 0, w, h);
};


/**
 * Three.js を初期化し、シーンを生成する。
 * @param {number} width シーンの横画素数。
 * @param {number} height シーンの縦画素数。
 * @param {Object} opts 生成のオプション。次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
 * <ul>
 *   <li>fov - number 画角。(デフォルト: 45.0)</li>
 *   <li>near - number カメラのどのくらい近くから描画範囲に含めるか。(デフォルト: 0.1)</li>
 *   <li>far - number カメラのどのくらい遠くまで描画範囲に含めるか。(デフォルト: 1000)</li>
 *   <li>axesLength - number シーンに表示するワールド座標軸の長さ。(デフォルト: 20)</li>
 *   <li>clearColor - number シーンの何もない領域を塗りつぶす色。(デフォルト: 0x222222)</li>
 *   <li>camPosX - number カメラの初期位置。(デフォルト: 0)</li>
 *   <li>camPosY - number カメラの初期位置。(デフォルト: 2)</li>
 *   <li>camPosZ - number カメラの初期位置。(デフォルト: -7)</li>
 *   <li>outputEncoding - number 出力の gamma 補正方式。(デフォルト: THREE.sRGBEncoding)</li>
 * </ul>
 * @returns {Array} 次の要素が入った配列。
 * <ul>
 *   <li>THREE.Scene</li>
 *   <li>THREE.PerspectiveCamera</li>
 *   <li>THREE.WebGLRenderer</li>
 *   <li>THREE.Clock</li>
 *   <li>THREE.AxesHelper (opts.axesLength が 0 以下の場合は生成されず、 null が帰る)</li>
 * </ul>
 */
mylib2020.initThree = function (width, height, opts) {
    opts = opts || {};
    const aspect = width / height;
    const fov = ('fov' in opts) ? opts.fov : 45.0;
    const near = ('near' in opts) ? opts.near : 0.1;
    const far = ('far' in opts) ? opts.far : 1000;
    const axesLength = ('axesLength' in opts) ? opts.axesLength : 20;
    const clearColor = ('clearColor' in opts) ? opts.clearColor : 0x222222;
    const camPosX = ('camPosX' in opts) ? opts.camPosX : 0;
    const camPosY = ('camPosY' in opts) ? opts.camPosY : 2;
    const camPosZ = ('camPosZ' in opts) ? opts.camPosZ : -7;
    const outputEncoding = ('outputEncoding' in opts) ? opts.outputEncoding : THREE.sRGBEncoding;

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    let renderer = new THREE.WebGLRenderer({ antialias: true });
    let clock = new THREE.Clock();
    let axes = null;
    if (axesLength > 0) {
        axes = new THREE.AxesHelper(axesLength);
        scene.add(axes);
    }
    renderer.setClearColor(new THREE.Color(clearColor));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = outputEncoding;
    camera.position.x = camPosX;
    camera.position.y = camPosY;
    camera.position.z = camPosZ;
    camera.lookAt(new THREE.Vector3(0, -0.5, 0));
    return [scene, camera, renderer, clock, axes];
};

/**
 * Three.js を初期化し、シーンを生成する。
 * @param {HTMLElement} element シーンの親となる HTML 要素。
 * @param {Object} opts 生成のオプション。次のようなキーでパラメータ指定する。null のとき、デフォルト値が使用される。
 * <ul>
 *   <li>fov - number 画角。(デフォルト: 45.0)</li>
 *   <li>near - number カメラのどのくらい近くから描画範囲に含めるか。(デフォルト: 0.1)</li>
 *   <li>far - number カメラのどのくらい遠くまで描画範囲に含めるか。(デフォルト: 1000)</li>
 *   <li>axesLength - number シーンに表示するワールド座標軸の長さ。(デフォルト: 20)</li>
 *   <li>clearColor - number シーンの何もない領域を塗りつぶす色。(デフォルト: 0x222222)</li>
 *   <li>camPosX - number カメラの初期位置。(デフォルト: 0)</li>
 *   <li>camPosY - number カメラの初期位置。(デフォルト: 2)</li>
 *   <li>camPosZ - number カメラの初期位置。(デフォルト: -7)</li>
 *   <li>outputEncoding - number 出力の gamma 補正方式。(デフォルト: THREE.sRGBEncoding)</li>
 * </ul>
 * @returns {Array} 次の要素が入った配列。
 * <ul>
 *   <li>THREE.Scene</li>
 *   <li>THREE.PerspectiveCamera</li>
 *   <li>THREE.WebGLRenderer</li>
 *   <li>THREE.Clock</li>
 *   <li>THREE.AxesHelper (opts.axesLength が 0 以下の場合は生成されず、 null が帰る)</li>
 * </ul>
 */
mylib2020.initThreeInElement = function (element, opts) {
    const rect = element.getBoundingClientRect();
    let [scene, camera, renderer, clock, axes] = mylib2020.initThree(rect.width, rect.height, opts);
    element.appendChild(renderer.domElement);
    return [scene, camera, renderer, clock, axes];
};


/**
 * fromObject の中心から指定した方向にレイを飛ばし、 targetMeshes に含まれる物体と交叉するかどうかを判定する。<br/>
 * 物理エンジンを用いない簡易な衝突判定法。
 * @param {THREE.Object3D} fromObject レイの中心となる物体。
 * @param {Array<THREE.Object3D>} targetMeshes レイの交叉判定対象となる物体群が入った配列。
 * @param {THREE.Vector3} direction レイの方向。
 * @param {number} [distance=1.5] レイとの交差地点と fromObject の距離がこの値未満なら衝突しているとみなす。
 * @returns {boolean} 衝突している物体があるか否か。 true: 何かと衝突している。
 */
mylib2020.checkCollision = function (fromObject, targetMeshes, direction, distance = 1.5) {
    const v = direction.clone();
    v.applyEuler(fromObject.rotation);
    const ray = new THREE.Raycaster(fromObject.position, v);
    const objs = ray.intersectObjects(targetMeshes);
    if (objs.length > 0) {
        if (objs[0].distance < distance) {
            return true;
        }
    }
    return false;
};

mylib2020.initPushButton = function (element, activeColor, onPressed = null, onReleased = null, normalColor = null) {
    const supportTouch = 'ontouchend' in document;
    if (normalColor == null) {
        normalColor = element.style.backgroundColor;
    }
    if (supportTouch) {
        element.addEventListener('touchstart',
            function (evt) {
                this.style.backgroundColor = activeColor;
                if (onPressed) {
                    onPressed(element);
                }
            },
            { passive: false });
        element.addEventListener('touchend',
            function (evt) {
                this.style.backgroundColor = normalColor;
                if (onReleased) {
                    onReleased(element);
                }
            },
            { passive: false });
    } else {
        element.addEventListener('mousedown', function (evt) {
            this.style.backgroundColor = activeColor;
            if (onPressed) {
                onPressed(element);
            }
        });
        element.addEventListener('mouseup', function (evt) {
            this.style.backgroundColor = normalColor;
            if (onReleased) {
                onReleased(element);
            }
        });
    }
};

/**
 * キャラクタ操作用のデジタルな十字キーのボタンを生成する。
 */
mylib2020.ArrowButton = class {
    /**
     * @constructor
     * @param {HTMLElement} container ボタンにしたい HTML 要素。
     * @param {string} activeImage ボタンが押された場合に表示する画像 URL。 
     * @param {boolean} verbose デバッグメッセージを console.log で表示するか否か。 
     */
    constructor(container, activeImage, verbose = false) {
        this.container = container;
        this.normalImage = this.container.style.backgroundImage;
        this.activeImage = activeImage;
        this.supportTouch = 'ontouchend' in document;
        this.verbose = verbose;
        this.state = false;
        const obj = this;
        console.log("Touch support  = " + this.supportTouch);
        if (this.supportTouch) {
            document.addEventListener('touchstart', function (evt) { obj.onTouchStart(evt); }, { passive: false });
            document.addEventListener('touchend', function (evt) { obj.onTouchEnd(evt); }, { passive: false });
            document.addEventListener('touchmove', function (evt) { obj.onTouchMove(evt); }, { passive: false });
        } else {
            this.container.addEventListener('mousedown', function (evt) { obj.onMouseDown(evt); });
            this.container.addEventListener('mouseup', function (evt) { obj.onMouseUp(evt); });
            this.container.addEventListener('mouseleave', function (evt) { obj.onMouseLeave(evt); });
        }
        this.update();
    }

    /**
     * ボタンが押されているか否か。
     * @returns {boolean} true: 押されている。 false: 押されていない。
     */
    isPressed() {
        return this.state;
    }

    update() {
        if (this.isPressed()) {
            this.container.style.backgroundImage = this.activeImage;
        } else {
            this.container.style.backgroundImage = this.normalImage;
        }
    }

    press() {
        this.state = true;
        this.update();
    }

    release() {
        this.state = false;
        this.update();
    }

    outputLog(arg) {
        if (this.verbose) {
            console.log(arg);
        }
    }

    contains(clientX, clientY, clientRect) {
        if (clientX < clientRect.x || clientRect.x + clientRect.width < clientX) {
            return false;
        }
        if (clientY < clientRect.y || clientRect.y + clientRect.height < clientY) {
            return false;
        }
        return true;
    }
    // For Mobile Phone
    checkTouch(e) {
        let hasTouch = false;
        let clientRect = this.container.getBoundingClientRect();
        for (let touch of e.touches) {
            this.outputLog(touch.clientX + "," + touch.clientY);
            if (this.contains(touch.clientX, touch.clientY, clientRect)) {
                hasTouch = true;
                break;
            }
        }
        if (hasTouch) {
            e.preventDefault();
        }
        if (this.isPressed() == false) {
            if (hasTouch) {
                this.press();
            }
        } else if (hasTouch == false) {
            this.release();
        }
    }

    onTouchStart(e) {
        this.outputLog('onTouchStart:');
        this.checkTouch(e);
    }

    onTouchEnd(e) {
        this.outputLog('onTouchEnd:');
        this.checkTouch(e);
    }

    onTouchMove(e) {
        this.outputLog('onTouchMove:');
        this.checkTouch(e);
    }
    // For PC
    onMouseDown(e) {
        e.preventDefault();
        this.outputLog('onMouseDown:');
        this.press();
    }

    onMouseUp(e) {
        e.preventDefault();
        this.outputLog('onMouseUp:');
        this.release();
    }

    onMouseLeave(e) {
        e.preventDefault();
        this.outputLog('onMouseLeave:');
        this.release();
    }
};

/**
 * GLTF モデルをロードする Promise を生成する。引数の src は連想配列で、ロードに成功すると src.gltf にロードされた gltf 全体が入る。
 * @param {{url: string, gltf: null}} src url にはロードする GLTF の URL を指定し、gltf の初期値は null にしておく。
 * @returns
 */
mylib2020.loadGltfPromise = function (src) {
    return new Promise(function (resolve, reject) {
        new THREE.GLTFLoader().load(src.url, // この関数は非同期的に実行される。
            function (gltf) { // モデルロードに成功
                const log = "loaded: " + src.url;
                src.gltf = gltf;
                resolve(log);
            }, null, function (error) {
                const log = "Failed to load: " + src.url + "," + error + "\n";
                reject(log);
            }
        );
    });
};

/**
 * srcArray に指定した GLTF を全てロードする Promise を生成する。
 * @param {Array.<{url: string, gltf: null}>} srcArray url にはロードする GLTF の URL を指定し、gltf の初期値を null にした連想配列の配列。
 * @returns
 */
mylib2020.loadMultiGltfPromise = function (srcArray) {
    return new Promise(function (resolve, reject) {
        const loaders = [];
        for (src of srcArray) {
            loaders.push(mylib2020.loadGltfPromise(src));
        }
        Promise.all(loaders).then(function (response) {
            let log = "";
            for (r of response) {
                log += r + "\n";
            }
            resolve(log);
        }).catch(function (err) {
            reject(err);
        });
    });
};

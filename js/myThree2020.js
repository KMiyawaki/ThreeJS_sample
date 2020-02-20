var mylib2020 = mylib2020 || {};

mylib2020.FORWARD = new THREE.Vector3(0, 0, 1);

mylib2020.BACK = new THREE.Vector3(0, 0, -1);

mylib2020.createRectSize = function (x, y, w, h) {
    return { x: x, y: y, width: w, height: h };
}

mylib2020.calcScreenSize = function (aspect, viewPortWidth, viewPortHeight) {
    let w = viewPortWidth
    let h = viewPortHeight;
    if (h * aspect > w) {
        h = w / aspect;
    } else {
        w = h * aspect;
    }
    return mylib2020.createRectSize(0, 0, w, h);
}

mylib2020.initThree = function (width, height, opts) {
    var opts = opts || {};
    const aspect = width / height;
    const fov = opts.fov || 45.0;
    const near = opts.near || 0.1;
    const far = opts.far || 1000;
    const axesLength = opts.axesLength || 20;
    const clearColor = opts.clearColor || 0x222222;
    const camPosX = opts.camPosX || 0;
    const camPosY = opts.camPosY || 2;
    const camPosZ = opts.camPosZ || -7;

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
    camera.position.x = camPosX;
    camera.position.y = camPosY;
    camera.position.z = camPosZ;
    camera.lookAt(new THREE.Vector3(0, -0.5, 0));
    return [scene, camera, renderer, clock, axes];
}

mylib2020.initThreeInElement = function (element, opts) {
    const rect = element.getBoundingClientRect();
    let [scene, camera, renderer, clock, axes] = mylib2020.initThree(rect.width, rect.height, opts);
    element.appendChild(renderer.domElement);
    return [scene, camera, renderer, clock, axes];
}

mylib2020.checkCollision = function(fromObject, targetMeshes, direction, distance = 1.5) {
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
}

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

}
mylib2020.arrowButton = class {
    constructor(container, activeStyle = { backgroundColor: "red" }, normalStyle = { backgroundColor: "green" }, verbose = false) {
        this.container = container;
        this.activeStyle = activeStyle;
        this.normalStyle = normalStyle;
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

    isPressed() {
        return this.state;
    }

    update() {
        let target = null;
        if (this.isPressed()) {
            target = this.activeStyle;
        } else {
            target = this.normalStyle;
        }
        for (let k in target) {
            this.container.style[k] = target[k];
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
}

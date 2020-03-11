/**
 * @fileOverview Three.js で簡単な迷路を生成するクラス例。
 * @author K.Miyawaki
 */

const createMyBlock = function (mapTexture, normalTexture, size) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size),
        new THREE.MeshPhongMaterial({ map: mapTexture, normalMap: normalTexture, normalScale: new THREE.Vector2(1, -1) }));
    cube.castShadow = true;
    cube.receiveShadow = true;
    return cube;
}


/**
 * 迷路データのサンプル。 0: 通行可, 1: 通行不可。
 * @type {Array<number>}
 */
const MyMazeTestData = [
    1, 1, 1, 1, 1,
    1, 0, 1, 0, 1,
    1, 0, 1, 0, 1,
    1, 0, 0, 0, 1,
    1, 1, 1, 1, 1
];

/**
 * Three.js で簡単な迷路を生成するクラス例。
 */
class MyMaze{
    /**
     * @constructor
     * @param {Array<number>} mapData 迷路の元となる 1 次元配列。
     * @param {number} width 迷路横幅（ブロック数）。
     * @param {number} height 迷路縦幅（ブロック数）。
     * @param {THREE.BoxGeometry} geometry 迷路の障害物のもとになる形状。 x と z の長さが等しいこと、つまり上（ y 軸正方向）から見て正方形であることを想定している。
     * @param {THREE.MeshPhongMaterial} material 迷路の障害物に付加される材質。
     */
    constructor(mapData, width, height, geometry, material, cubeSize) {
        this.mapData = mapData;
        this.width = width;
        this.height = height;
        this.geometry = geometry;
        this.material = material;
        this.build();
    }

    createCube(x, y, z) {
        const cube = new THREE.Mesh(this.geometry, this.material);
        cube.position.set(x, y, z);
        return cube;
    }

    calcIndex(ix, iy) {
        const index = iy * this.width + ix;
        if (index < 0 || this.mapData.length <= index) {
            return null;
        }
        return index;
    }

    calcPositionFromIndex(ix, iy) {
        const x = this.geometry.parameters.width * ix;
        const y = this.geometry.parameters.height / 2;
        const z = this.geometry.parameters.depth * iy;
        return { x: x, y: y, z: z };
    }

    calcIndexFromPosition(x, y, z) {
        const ix = Math.floor(x / this.geometry.parameters.width);
        const iy = Math.floor(z / this.geometry.parameters.depth);
        return { ix: ix, iy: iy };
    }

    getCellTypeFromIndex(ix, iy) {
        const index = this.calcIndex(ix, iy);
        if (index) {
            return this.mapData[index];
        }
        return null;
    }

    getCellFromIndex(ix, iy) {
        const index = this.calcIndex(ix, iy);
        if (index) {
            return this.mapObject[index];
        }
        return null;
    }

    /**
     * ある座標の周囲に存在する障害物の配列を得る。
     * @param {number} x 3 次元座標の x 。
     * @param {number} y 3 次元座標の y 。
     * @param {number} z 3 次元座標の z 。
     * @param {number} [iw=5] どの範囲の障害物を得たいか、迷路のブロック数で指定する。
     * @param {number} [ih=5] どの範囲の障害物を得たいか、迷路のブロック数で指定する。
     * @returns {Array<THREE.Mesh>}
     * @memberof MyMaze
     */
    getAroundCells(x, y, z, iw = 5, ih = 5) {
        const i = this.calcIndexFromPosition(x, y, z);
        const cells = [];
        for (let iy = i.iy - Math.floor(ih / 2); iy < ih; iy++) {
            for (let ix = i.ix - Math.floor(iw / 2); ix < iw; ix++) {
                const cell = this.getCellFromIndex(ix, iy);
                if(cell){
                    cells.push(cell);
                }
            }
        }
        return cells;
    }

    /**
     * 迷路を生成する。
     * @memberof MyMaze
     */
    build() {
        this.mapObject = new Array(this.mapData.length);
        let index = 0;
        for (let iy = 0; iy < this.height; iy++) {
            for (let ix = 0; ix < this.width; ix++) {
                const cellType = this.mapData[index];
                if (cellType == 1) {
                    const pos = this.calcPositionFromIndex(ix, iy);
                    const cube = this.createCube(pos.x, pos.y, pos.z);
                    this.mapObject[index] = cube;
                }
                index++;
            }
        }
    }

    /**
     * 生成した迷路をシーンに表示する。
     * @param {THREE.Scene} scene
     * @memberof MyMaze
     */
    addToScene(scene) {
        for (const cube of this.mapObject) {
            if (cube) {
                scene.add(cube);
            }
        }
    }
}

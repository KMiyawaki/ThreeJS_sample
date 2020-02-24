const createMyBlock = function (mapTexture, normalTexture, size) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(size, size, size),
        new THREE.MeshPhongMaterial({ map: mapTexture, normalMap: normalTexture, normalScale: new THREE.Vector2(1, -1) }));
    cube.castShadow = true;
    cube.receiveShadow = true;
    return cube;
}

const MyMazeTestData = [
    1, 1, 1, 1, 1,
    1, 0, 1, 0, 1,
    1, 0, 1, 0, 1,
    1, 0, 0, 0, 1,
    1, 1, 1, 1, 1
];

class MyMaze{
    constructor(mapData, width, height, geometry, material, cubeSize) {
        this.mapData = mapData;
        this.width = width;
        this.height = height;
        this.geometry = geometry;
        this.material = material;
        this.cubeSize = cubeSize;
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
        const x = this.cubeSize * ix;
        const y = this.cubeSize / 2;
        const z = this.cubeSize * iy;
        return { x: x, y: y, z: z };
    }

    calcIndexFromPosition(x, y, z) {
        const ix = Math.floor(x / this.cubeSize);
        const iy = Math.floor(z / this.cubeSize);
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

    addToScene(scene) {
        for (const cube of this.mapObject) {
            if (cube) {
                scene.add(cube);
            }
        }
    }
}

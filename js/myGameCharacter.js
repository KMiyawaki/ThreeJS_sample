/**
 * @fileOverview RPG のキャラクタ等を表現するクラス例。
 * @author K.Miyawaki
 */

/**
 * RPG キャラクタが持つ武器を表現するクラス例。
 */
class MyGameItem {
    /**
     * @constructor
     * @param {string} name 名前。 
     * @param {number} attackMin ダメージ最小値。 
     * @param {number} attackMax ダメージ最大値。 
     * @param {number} attackCount 攻撃回数。 
     * @param {number} stock 所持数。 null で無限に使用できる。
     */
    constructor(name, attackMin, attackMax, attackCount, stock) {
        this.name = name;
        this.attackMin = attackMin;
        this.attackMax = attackMax;
        this.attackCount = attackCount;
        this.stock = stock;
    }

    /**
     * この武器がまだ使えるかどうか。
     * @returns {boolean} 使えるなら true 。
     * @memberof MyGameItem
     */
    checkCount() {
        if (this.stock == null) {
            return true;
        }
        return this.stock > 0;
    }

    /**
     * この武器を使い、所持数を減らす。0 未満にはしない。 this.stock が null なら何もしない。
     * @memberof MyGameItem
     */
    use() {
        if (this.stock) {
            this.stock = Math.max(0, this.stock - 1);
        }
    }

    /**
     * この武器で攻撃した場合の 1 回あたりのダメージを計算する。
     * @returns {number}
     * @memberof MyGameItem
     */
    calcAttackBonus() {
        return Math.floor(Math.random() * (this.attackMax + 1 - this.attackMin)) + this.attackMin;
    }

    /**
     * この武器の文字列での表現を得る。
     * @returns {string}
     * @memberof MyGameItem
     */
    getString() {
        let text = this.name + ":";
        if (this.stock == null) {
            text += "無制限";
        } else {
            text += this.stock;
        }
        return text;
    }
}

/**
 * RPG のキャラクタを表現するクラス例。
 */
class MyGameCharacter {
    /**
     * @constructor
     * @param {string} name キャラクタの名前。
     * @param {string} [imageURL=null] 画像の URL 。null なら画像表示しない。
     * @param {number} [hp=1] 体力。
     * @param {number} [power=1] 腕力。
     * @param {number} [defense=1] 防御力。
     * @param {number} [speed=1] 素早さ。
     */
    constructor(name, imageURL = null, hp = 1, power = 1, defense = 1, speed = 1) {
        this.name = name;
        this.hp = hp;
        this.power = power;
        this.defense = defense;
        this.speed = speed;
        this.wepon = new MyGameItem("素手", 0, 5, 1, null);
        this.items = [this.wepon];
        this.imageURL = imageURL;
        this.image = null;
    }

    /**
     * キャラクタの画像をロードして、指定された HTML 要素に表示する。
     * @param {HTMLDocument} targetElement
     * @memberof MyGameCharacter
     */
    show(targetElement) {
        if (this.imageURL) {
            this.image = document.createElement("img");
            let obj = this;
            this.image.onload = function () {
                obj.onLoad();
                obj.addImage(targetElement);
            }
            this.image.src = this.imageURL;
        }
    }

    onLoad() {
        this.image.style.position = "absolute";
        this.image.style.left = "0px";
        this.image.style.top = "0px";
        this.image.style.width = "auto";
        this.image.style.height = "80%";
    }

    addImage(targetElement) {
        if (this.image) {
            targetElement.appendChild(this.image);
            const targetRect = targetElement.getBoundingClientRect();
            const imageRect = this.image.getBoundingClientRect();
            const left = (targetRect.width - imageRect.width) / 2;
            const top = (targetRect.height - imageRect.height) / 2;
            this.image.style.left = left + "px";
            this.image.style.top = top + "px";
        }
    }

    /**
     * キャラクタ画像を指定した HTML 要素から取り除く。
     * @param {HTMLElement} targetElement
     * @memberof MyGameCharacter
     */
    remove(targetElement) {
        if (this.image) {
            targetElement.removeChild(this.image);
        }
    }

    /**
     * キャラクタが生存しているか否か。 true: 生存している。
     * @returns {boolean}
     * @memberof MyGameCharacter
     */
    isAlive() {
        return this.hp > 0;
    }

    /**
     * 他のキャラクタに攻撃が命中するか否か。 true: 命中する。
     * @param {MyGameCharacter} targetCharacter 攻撃対象。
     * @returns {boolean}
     * @memberof MyGameCharacter
     */
    checkHit(targetCharacter) {
        return (Math.random() * this.speed) > (Math.random() * targetCharacter.speed);
    }

    /**
     * targetCharacter に攻撃し、ダメージを与える。
     * @param {MyGameCharacter} targetCharacter
     * @param {MyGameItem} wepon
     * @returns {Object} 以下のキーを持つ Object 。
     * <ul>
     *   <li>hitCount: 攻撃命中回数</li>
     *   <li>damage: 与えたダメージ</li>
     *   <li>message: 攻撃結果を表現する文字列</li>
     * </ul>
     * @memberof MyGameCharacter
     */
    attackTo(targetCharacter, wepon) {
        let damage = 0;
        let hitCount = 0;
        let message = "";
        if (wepon.checkCount()) {
            for (let i = 0; i < wepon.attackCount; i++) {
                let attack = wepon.calcAttackBonus() + this.power;
                if (this.checkHit(targetCharacter)) {
                    hitCount++;
                    damage += Math.max(0, attack - targetCharacter.defense);
                }
            }
            wepon.use();
            message = this.name + "は" + wepon.name + "で攻撃した。" + targetCharacter.name + "に";
            if (damage > 0) {
                message += (hitCount + " 回命中し、" + damage + " のダメージを与えた。");
            } else {
                message += "ダメージはない。";
            }
        } else {
            message = this.name + "は" + wepon.name + "で攻撃しようとしたが弾切れだった。";
        }
        targetCharacter.hp -= damage;
        return { hitCount: hitCount, damage: damage, message: message };
    }

    /**
     * このキャラクタのステータスを表示する。
     * @param {HTMLElement} htmlElement 表示対象の HTML 要素。
     * @memberof MyGameCharacter
     */
    print(htmlElement) {
        htmlElement.innerHTML = "";
        htmlElement.innerHTML += ("<b>" + this.name + "</b><br />");
        htmlElement.innerHTML += ("体力:" + this.hp + "<br />");
        htmlElement.innerHTML += ("腕力:" + this.power + "<br />");
        htmlElement.innerHTML += ("防御:" + this.defense + "<br />");
        htmlElement.innerHTML += ("素早さ:" + this.speed + "<br />");
        htmlElement.innerHTML += ("<b>持ち物</b><br />");
        for (let item of this.items) {
            htmlElement.innerHTML += (item.getString() + "<br />");
        }
    }

    useItem(item) {
        if (item.checkCount() && this[item.targetParam]) {
            this[item.targetParam] += item.bonusValue;
            item.use();
        }
    }
}

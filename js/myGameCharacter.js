class MyGameItem {
    constructor(name, attackMin, attackMax, attackCount, stock) {
        this.name = name;
        this.attackMin = attackMin;
        this.attackMax = attackMax;
        this.attackCount = attackCount;
        this.stock = stock;
    }

    checkCount() {
        if (this.stock == null) {
            return true;
        }
        return this.stock > 0;
    }

    use() {
        if (this.stock) {
            this.stock = Math.max(0, this.stock - 1);
        }
    }

    calcAttackBonus() {
        return Math.floor(Math.random() * (this.attackMax + 1 - this.attackMin)) + this.attackMin;
    }

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

class MyGameCharacter {
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

    remove(targetElement) {
        if (this.image) {
            targetElement.removeChild(this.image);
        }
    }

    isAlive() {
        return this.hp > 0;
    }

    checkHit(targetCharacter) {
        return (Math.random() * this.speed) > (Math.random() * targetCharacter.speed);
    }

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

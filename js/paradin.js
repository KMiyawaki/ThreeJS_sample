const Paradin = {
    onUpdate: function (ammo, character, deltaTime, params) {
        const LINEAR = 3.0; // 直進速度 3.0m/sec
        const ANGULAR = THREE.Math.degToRad(90); // 回転速度 60deg/sec
        const isAttackPressed = params.arrows["action"].isPressed();
        character.userData.linearVelocity = 0;
        character.userData.angularVelocity = 0;
        if (params.arrows["up"].isPressed()) {
            character.userData.linearVelocity = LINEAR;
        }
        if (params.arrows["down"].isPressed()) {
            character.userData.linearVelocity = -LINEAR;
        }
        if (params.arrows["left"].isPressed()) {
            character.userData.angularVelocity = ANGULAR;
        }
        if (params.arrows["right"].isPressed()) {
            character.userData.angularVelocity = -ANGULAR;
        }

        const idle = character.userData.actions[0];
        const running = character.userData.actions[1];
        const attack = character.userData.actions[2];
        const crntAction = character.userData.crntAction;
        let nextAction = character.userData.crntAction;
        const isMoving = (Math.abs(character.userData.linearVelocity) > 0 || Math.abs(character.userData.angularVelocity) > 0);
        if (crntAction == idle) {
            if (isAttackPressed) {
                nextAction = attack;
            } else if (isMoving) {
                nextAction = running;
            }
        } else if (crntAction == running) {
            if (isAttackPressed) {
                nextAction = attack;
            } else if (!isMoving) {
                nextAction = idle;
            }
        } else if (crntAction == attack) {
            if (crntAction.time + deltaTime >= crntAction.getClip().duration) {
                nextAction = idle;
            }
        }
        if (nextAction == attack) {
            character.userData.linearVelocity = 0;
            character.userData.angularVelocity = 0;
        }
        if (nextAction != crntAction) {
            character.userData.crntAction.stop();
            character.userData.crntAction = nextAction;
            character.userData.crntAction.play();
        }
        character.userData.mixer.update(deltaTime);
    }
};

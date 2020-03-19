const Paradin = {
    onUpdate: function (ammo, character, deltaTime, params) {
        let nextAction = character.userData.crntAction;
        if (character.userData.crntAction == character.userData.actions[0]) {
            if (character.userData.attack) {
                nextAction = character.userData.actions[2];
            } else if (Math.abs(character.userData.linearVelocity) > 0 || Math.abs(character.userData.angularVelocity) > 0) {
                nextAction = character.userData.actions[1];
            }
        } else if (character.userData.crntAction == character.userData.actions[1]) {
            if (character.userData.attack) {
                nextAction = character.userData.actions[2];
                character.userData.attack = false;
            } else if (Math.abs(character.userData.linearVelocity) <= 0 && Math.abs(character.userData.angularVelocity) <= 0) {
                nextAction = character.userData.actions[0];
            }
        } else if (character.userData.crntAction == character.userData.actions[2]) {
            if (character.userData.crntAction.time + deltaTime >= character.userData.crntAction.getClip().duration) {
                nextAction = character.userData.actions[0];
                character.userData.attack = false;
            }
        }
        if (nextAction != character.userData.crntAction) {
            character.userData.crntAction.stop();
            character.userData.crntAction = nextAction;
            character.userData.crntAction.play();
        }
        console.log(character.userData.crntAction.time + "/" + character.userData.crntAction.getClip().duration);
        character.userData.mixer.update(deltaTime);
    }
};

const Paradin = {
    onUpdate: function (ammo, character, deltaTime, params) {
        let nextAction = character.userData.crntAction;
        if (Math.abs(character.userData.linearVelocity) > 0 || Math.abs(character.userData.angularVelocity) > 0) {
            nextAction = character.userData.actions[1];
        } else {
            nextAction = character.userData.actions[0];
        }
        if (nextAction != character.userData.crntAction) {
            character.userData.crntAction.stop();
            character.userData.crntAction = nextAction;
            character.userData.crntAction.play();
        }
        character.userData.mixer.update(deltaTime);
    }
};

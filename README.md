# Simple Space Game

This is a simple space game I wrote based on Microsoft's Web Dev for Beginners repo. I used that as a base but have built on top of that, replacing some of the more weird aspects of it to make it a bit more of an actually playable game. Some examples:

- I used a recursive `window.requestAnimationFrame()` call instead of Microsoft's `setInterval`s. The animation (what little there is) is much smoother as a result. For instance:

``` javascript
window.requestAnimationFrame(gameLoop)

function gameLoop(timeStamp) {
    // drawing and updating logic
    window.requestAnimationFrame(gameLoop);
}
```

- The original used `keyup` events for accepting inputs, which means that the action occurs when you release the key, rather than pressing the key, and you also cannot hold the key to move repeatedly. I have changed the accepting input flow significantly.

    - The Pub/Sub architecture is still in use, but rather than the publication of messages directly causing changes in the game, it usually updates various pieces of state that get acted upon on each frame.

    - There may be some exceptions for certain actions.

    - Instead of keypresses happening on keyup, there is a separate keydown and keyup message that gets broadcast, and the subscribers to those events set a keyboard state object, which is read each frame to move the hero ship around and fire lasers accordingly.

    - This way as long as the key is held down the keyboard state object reflects that, so you can hold an arrow key to move.

    - Currently firing lasers is done this way as well, but it may be better to revert firing back to the old way so the space bar has to be hit each time you want to fire, but that is more of a Game Design debate than implementation.

- The original game did not have a fail condition for when enemy ships left the screen, that has been added.

In order to run the game. Clone this repo, run `npm start`, and go to the ip:port it gives you in your web browser (or just click/ctrl+click if your terminal emulator supports it.).
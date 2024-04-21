# Find my Favorite Color

1. What is the project?

This project is a web application that lets a user find their favorite color. It cycles through all hex color values, doing a kind of tournament, until one color is remaining.

2. What is the MVP (minimal viable product)?

The application must allow a user to login and save progress to the account.
The user must be allowed to select one color, get two fresh colors, or restart the 'game'.
The user must be able to stay logged in.
When a user logs out, the game will be reset.

3. What are the nice-to-haves?

The application must save a user's progress locally.
The hex values of the colors should be available.

4. When will the project be complete?

When the MVP is complete and the site has been styed, the project will be complete.

## How to store the next colors?

-   creating an array that is 0x1000000 elements long take ~1 second

#### Option 1

-   after choosing a color, check if colorsRemainingCurrentIteration < some number.
    If yes, go through all colors and create \_colors array.
    If no, get two random numbers for the next colors

Pros:

-   easy to implement
-   requires less persistent storage

Cons:

-   the time-consuming loop must still take place, it's just delayed

#### Option 2

-   create the long arrays in a background thread

Details:

-   when game is initialized, create array of 1000.
    in the background, create a huge array containing all colors and shuffle it. then, combine the arrays.
    when a color is chosen, it is added to the 'nextIterationColors' array, so we don't need to rebuild anything at every iteration - we just
    shuffle that array and make it the \_colors array

    when a game is saved, save the first 1000 elements from the \_colors array (or less if there are less). we also need to save the list
    of colors for the next iteration - we do this with one more Uint32Array array

    then when a game is loaded, we have the first 1000 elements, and the remainder can be loaded in the background. we can also build the list of colors for the next iteration in the background

Pros:

-   performance could be very good

Cons:

-   complexity would go up a non-insignificant amount

#### Option 3

-   it's unlikely that the \_colors arrays _needs_ to be long (a user would need to be actively playing for a long time).
    therefore, do a combination of the above: when a game is initialized,

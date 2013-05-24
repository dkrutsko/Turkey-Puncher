////////////////////////////////////////////////////////////////////////////////
// -------------------------------------------------------------------------- //
//                                                                            //
//                        (C) 2009-2013  David Krutsko                        //
//                        See LICENSE.md for copyright                        //
//                                                                            //
// -------------------------------------------------------------------------- //
////////////////////////////////////////////////////////////////////////////////

'use strict';

//----------------------------------------------------------------------------//
// Turkey Puncher                                                             //
//----------------------------------------------------------------------------//

////////////////////////////////////////////////////////////////////////////////
/// Represents the main application class responsible for doing everything.

var TurkeyGame =
{
	//----------------------------------------------------------------------------//
	// Sprite                                                                     //
	//----------------------------------------------------------------------------//

	////////////////////////////////////////////////////////////////////////////////
	/// Represents a class for loading multiple frames of images and rendering them.

	Sprite : function()
	{
		//----------------------------------------------------------------------------//
		// Properties                                                                 //
		//----------------------------------------------------------------------------//

		this.Frame		= 0;		// Current sprite frame
		this.Elapsed	= 0;		// Current elapsed time
		this.Opacity	= 1.0;		// Curent sprite opacity
		this.Reverse	= false;	// Whether to reverse animation



		//----------------------------------------------------------------------------//
		// Fields                                                                     //
		//----------------------------------------------------------------------------//

		var mImages		= [];		// Array of loaded image frames
		var mLoaded		= [];		// Whether the images are loaded



		//----------------------------------------------------------------------------//
		// Functions                                                                  //
		//----------------------------------------------------------------------------//
		
		////////////////////////////////////////////////////////////////////////////////
		/// Returns whether all images in this sprite have been loaded.

		this.IsLoaded = function()
		{
			// Verify that all images have been loaded
			for (var i = 0; i < mLoaded.length; ++i)
				if (mLoaded[i] === false) return false;

			return true;
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Returns the number of frames in this sprite.

		this.FrameCount = function()
		{
			return mImages.length;
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Loads and adds the specified image to this sprite.
		/// image: The path of the image that needs to be loaded.

		this.AddFrame = function (image)
		{
			var index = mLoaded.length;
			mLoaded.push (false);

			var frame = new Image();
			frame.onload = function()
			{
				mLoaded[index] = true;
			}

			frame.src = image;
			mImages.push (frame);
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Renders the current sprite frame to the specified context.

		this.Render = function (context, x, y)
		{
			// Check if frame is loaded
			if (mLoaded[this.Frame])
			{
				// Apply the opacity
				context.globalAlpha = this.Opacity;

				// Draw current frame to the specified context
				context.drawImage (mImages[this.Frame], x, y);

				// Reset the opacity
				context.globalAlpha = 1.0;
			}
		}
	},



	//----------------------------------------------------------------------------//
	// Properties                                                                 //
	//----------------------------------------------------------------------------//

	////////////////////////////////////////////////////////////////////////////////
	/// Represents a single scrolling score after punching or killing a turkey.

	Score : function (x, y, amount)
	{
		//----------------------------------------------------------------------------//
		// Fields                                                                     //
		//----------------------------------------------------------------------------//

		var mElapsed	= 0;		// Current elapsed time
		var mOpacity	= 1.0;		// Curent score opacity



		//----------------------------------------------------------------------------//
		// Functions                                                                  //
		//----------------------------------------------------------------------------//

		////////////////////////////////////////////////////////////////////////////////
		/// Returns the current opacity of the score.

		this.GetOpacity = function()
		{
			return mOpacity;
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Performs a single update on this score object.

		this.Update = function (elapsed)
		{
			// Animate fading out
			mElapsed += elapsed;
			if (mElapsed > 30)
			{
				y -= 0.5;
				mOpacity -= 0.035;
				mElapsed = 0;
			}
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Renders the score to the specified context.

		this.Render = function (context)
		{
			// Apply the opacity
			context.globalAlpha = mOpacity;

			// Draw the player score
			context.font = 'bold 22pt Arial';
			context.fillStyle = 'rgba(200, 200, 200, 0.75)';
			context.fillText ('+ ' + amount, x, y);

			// Reset the opacity
			context.globalAlpha = 1.0;
		}
	},



	//----------------------------------------------------------------------------//
	// Player                                                                     //
	//----------------------------------------------------------------------------//

	////////////////////////////////////////////////////////////////////////////////
	/// A helper class for representing a single player.

	Player : function (game, turkey)
	{
		//----------------------------------------------------------------------------//
		// Setup                                                                      //
		//----------------------------------------------------------------------------//

		var mScore     = 0;
		var mLastPunch = 1000;
		var mScores    = [];
		var mScoresX   = 300;
		var mScoresY   = 300;

		var mHead   = new game.Sprite();
		var mPlayer = new game.Sprite();

		mPlayer.AddFrame ('images/player/punch1.png');
		mPlayer.AddFrame ('images/player/punch2.png');
		mPlayer.AddFrame ('images/player/punch3.png');
		mPlayer.AddFrame ('images/player/punch4.png');

		mHead.AddFrame ('images/player/head1.png');
		mHead.AddFrame ('images/player/head2.png');
		mHead.AddFrame ('images/player/head3.png');
		mHead.AddFrame ('images/player/head4.png');



		//----------------------------------------------------------------------------//
		// Functions                                                                  //
		//----------------------------------------------------------------------------//

		////////////////////////////////////////////////////////////////////////////////
		/// Returns the current score of the player.

		this.GetScore = function()
		{
			return mScore;
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Begins a player punch if one could be made.

		this.Punch = function()
		{
			// Check if player can punch
			if (mPlayer.Frame === 0 &&
				turkey.GetPos() === 260)
			{
				// Start punch animation
				mPlayer.Frame = 1;
				mPlayer.Reverse = false;
				mPlayer.Elapsed = 0;
			}
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Performs a single update on this player object.

		this.Update = function (elapsed)
		{
			// Animate the player head
			mHead.Elapsed += elapsed;
			if (mHead.Frame !== 3 &&
				mHead.Elapsed > 1400)
			{
				// Display random idle frame
				mHead.Frame = Math.floor
					(Math.random() * 2.9999);
				mHead.Elapsed = 0;
			}

			// Animate player kill head
			if (mHead.Frame === 3 &&
				mHead.Elapsed > 750)
			{
				// Display random head frame
				mHead.Frame = Math.floor
					(Math.random() * 2.9999);
				mHead.Elapsed = 0;
			}

			// Update last punch timer
			mLastPunch += elapsed;

			// Animate the player punch
			mPlayer.Elapsed += elapsed;
			if (mPlayer.Frame !== 0 &&
				mPlayer.Elapsed > 60)
			{
				// Animate player frames
				if (mPlayer.Reverse)
					--mPlayer.Frame;
				else
					++mPlayer.Frame;

				// Player has hit the turkey
				if (mPlayer.Frame === 3)
				{
					// Reverse punch animation
					mPlayer.Reverse = true;

					// Hit turkey
					turkey.Hit();

					// Check turkey lives
					if (turkey.IsDead())
					{
						mHead.Frame = 3;
						mHead.Elapsed = 0;

						mScore += 250;
						mScores.push (new game.Score (300, 300, 250));
					}

					else
					{
						if (mLastPunch < 400)
						{
							mScore += 25;
							mScores.push (new game.Score
								(mScoresX, mScoresY, 25));
						}

						else
						{
							mScore += 10;
							mScores.push (new game.Score
								(mScoresX, mScoresY, 10));
						}
					}

					// Update next score position
					mScoresX += 15;
					mScoresY += 20;

					if (mScoresY > 400)
					{
						mScoresX = 300;
						mScoresY = 300;
					}

					// Reset last punch
					mLastPunch = 0;
				}

				mPlayer.Elapsed = 0;
			}

			// Clean out the scores
			for (var i = mScores.length - 1; i >= 0; --i)
			{
				mScores[i].Update (elapsed);
				if (mScores[i].GetOpacity() <= 0.0)
					mScores.splice (i, 1);
			}
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Renders the player to the specified context.

		this.Render = function (context)
		{
			// Draw the player and head
			mPlayer.Render (context, 50, 420);
			mHead  .Render (context, 40,  35);

			// Draw the score countdown
			for (var i = 0; i < mScores.length; ++i)
				mScores[i].Render (context);
		}
	},



	//----------------------------------------------------------------------------//
	// Turkey                                                                     //
	//----------------------------------------------------------------------------//

	////////////////////////////////////////////////////////////////////////////////
	/// A helper class for representing a single turkey object.

	Turkey : function (game)
	{
		//----------------------------------------------------------------------------//
		// Setup                                                                      //
		//----------------------------------------------------------------------------//

		var mLives = 6;
		var mPos   = 260;

		var mTurkey  = new game.Sprite();
		var mGib     = new game.Sprite();
		var mFeather = new game.Sprite();

		var mFeather1Pos  = 0;
		var mFeather2Pos  = 0;
		var mFeatherSpeed = 0.0;

		mTurkey.AddFrame ('images/turkey/idle1.png');
		mTurkey.AddFrame ('images/turkey/idle2.png');
		mTurkey.AddFrame ('images/turkey/idle3.png');
		mTurkey.AddFrame ('images/turkey/hit.png');

		mGib.Opacity = 0.0;
		mGib.AddFrame ('images/turkey/gib1.png');
		mGib.AddFrame ('images/turkey/gib2.png');
		mGib.AddFrame ('images/turkey/gib3.png');
		mGib.AddFrame ('images/turkey/gib4.png');
		mGib.AddFrame ('images/turkey/gib5.png');
		mGib.AddFrame ('images/turkey/gib6.png');
		mGib.AddFrame ('images/turkey/gib7.png');
		mGib.AddFrame ('images/turkey/gib8.png');
		mGib.AddFrame ('images/turkey/gib9.png');

		mFeather.Opacity = 0.0;
		mFeather.AddFrame ('images/turkey/feather1.png');
		mFeather.AddFrame ('images/turkey/feather2.png');

		var mPunch1 = new Audio();
		var mPunch2 = new Audio();
		var mSquish = new Audio();

		if (!game.IsMobile())
		{
			mPunch1.src = 'sounds/punch1.wav';
			mPunch2.src = 'sounds/punch2.wav';
			mSquish.src = 'sounds/squish.wav';
		}



		//----------------------------------------------------------------------------//
		// Functions                                                                  //
		//----------------------------------------------------------------------------//

		////////////////////////////////////////////////////////////////////////////////
		/// Returns the current Y position of the turkey.

		this.GetPos = function()
		{
			return mPos;
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Returns the number of lives this turkey has remaining.

		this.GetLives = function()
		{
			return mLives;
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Returns whether or not this turkey is currently dead.

		this.IsDead = function()
		{
			return mLives === 0;
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Performs a single hit on this turkey object.

		this.Hit = function()
		{
			// Play the punch sound
			if (Math.round (Math.random()) === 1)
				mPunch1.play(); else mPunch2.play();

			// Check turkey lives
			if (--mLives === 0)
			{
				// Play squish
				mSquish.play();

				// Set opacity
				mTurkey.Elapsed = 0;
				mTurkey.Opacity = 0.0;
				mFeather.Elapsed = 0;
				mFeather.Opacity = 1.0;
				mGib.Elapsed = 0;
				mGib.Opacity = 1.0;

				// Set positions
				mPos = -305;

				mFeather1Pos  = 290;
				mFeather2Pos  = 270;
				mFeatherSpeed = 0.0;
			}

			else
			{
				// Set animation
				mTurkey.Frame   = 3;
				mTurkey.Elapsed = 0;
			}
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Performs a single update on this turkey object.

		this.Update = function (elapsed)
		{
			// Animate the turkey idling
			mTurkey.Elapsed += elapsed;
			if (mTurkey.Frame < 2 &&
				mTurkey.Elapsed > 2000)
			{
				// Display random idle frame
				mTurkey.Frame = Math.floor
					(Math.random() * 2.9999);
				mTurkey.Elapsed = 0;
			}

			// Animate the turkey blinking
			if (mTurkey.Frame === 2 &&
				mTurkey.Elapsed > 100)
			{
				// Display random idle frame
				mTurkey.Frame = Math.floor
					(Math.random() * 1.9999);
				mTurkey.Elapsed = 0;
			}

			// Animate turkey being hit
			if (mTurkey.Frame === 3 &&
				mTurkey.Elapsed > 200)
			{
				// Reset turkey to idle
				mTurkey.Frame = Math.floor
					(Math.random() * 2.9999);
				mTurkey.Elapsed = 0;
			}

			// Animate turkey dying
			mGib.Elapsed += elapsed;
			if (mGib.Opacity > 0 &&
				mGib.Elapsed > 60 &&
				mGib.Frame < 8)
			{
				++mGib.Frame;
				mGib.Elapsed = 0;
			}

			// Animate turkey feathers
			mFeather.Elapsed += elapsed;
			if (mFeather.Opacity > 0 &&
				mFeather.Elapsed > 30)
			{
				mFeather1Pos += 1 + mFeatherSpeed;
				mFeather2Pos += 2 + mFeatherSpeed;
				mFeatherSpeed += 0.05;
				mFeather.Elapsed = 0;
			}

			// Fade out gibbed turkey
			if (mGib.Frame === 8 &&
				mGib.Elapsed > 30)
			{
				mGib.Opacity -= 0.03;
				mGib.Elapsed = 0;

				if (mGib.Opacity < 0)
				{
					mGib.Opacity = 0.0;
					mGib.Frame   = 0;
				}
			}

			// Spawn another turkey
			if (mPos < 260 &&
				mTurkey.Elapsed > 30 &&
				mGib.Opacity < 0.90)
			{
				mPos += 30;
				mTurkey.Opacity = 1.0;
				mTurkey.Elapsed = 0;

				if (mPos >= 260)
				{
					mLives = 6;
					mPos = 260;

					mFeather.Opacity = 0.0;
				}
			}
		}

		////////////////////////////////////////////////////////////////////////////////
		/// Renders the turkey to the specified context.

		this.Render = function (context)
		{
			// Draw the turkey, gib and feathers
			mGib    .Render (context, 285, 260);
			mFeather.Render (context, 360, mFeather1Pos); mFeather.Frame = 1;
			mFeather.Render (context, 420, mFeather2Pos); mFeather.Frame = 0;
			mTurkey .Render (context, 285, mPos);
		}
	},



	//----------------------------------------------------------------------------//
	// Model                                                                      //
	//----------------------------------------------------------------------------//

	mTimer			: 0,			// Time since last update
	mPlayer			: null,			// Instance of the player
	mTurkey			: null,			// Instance of the turkey

	mCanvas			: null,			// Canvas of the game
	mContext		: null,			// Canvas 2D context

	mBg				: null,			// Background image
	mBorder			: null,			// View border image
	mLogo			: null,			// Game logo image
	mHead			: null,			// Player head animation

	mBuffer			: null,			// Offscreen border canvas
	mBContext		: null,			// Buffer 2D context

	mBorderR		: 64,			// Border red channel
	mBorderG		: 128,			// Border green channel
	mBorderB		: 192,			// Border blue channel
	mRevBorderR		: false,		// Reverse border red channel
	mRevBorderG		: false,		// Reverse border green channel
	mRevBorderB		: false,		// Reverse border blue channel

	mIntro			: null,			// Intro sound effect
	mMusic			: null,			// Background music



	//----------------------------------------------------------------------------//
	// Functions                                                                  //
	//----------------------------------------------------------------------------//

	////////////////////////////////////////////////////////////////////////////////
	/// Resizes the game canvas based on the window dimensions.

	ResizeWindow : function (game)
	{
		// Compute the new height of the canvas
		var height = window.innerHeight * 0.51;

		// Set the new canvas width and height
		game.mCanvas.style.width  = height * (880 / 600) + 'px';
		game.mCanvas.style.height = height + 'px';
	},

	////////////////////////////////////////////////////////////////////////////////
	/// Determines whether the current browser is mobile.

	IsMobile : function()
	{
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test (navigator.userAgent);
	},

	////////////////////////////////////////////////////////////////////////////////
	/// Animates the border with an assortment of colors.

	AnimateBorder : function (amount)
	{
		amount = Math.ceil (amount);

		this.mBorderR += this.mRevBorderR ? -3 - amount : 5 + amount;
		this.mBorderG += this.mRevBorderG ? -1 - amount : 3 + amount;
		this.mBorderB += this.mRevBorderB ? -5 - amount : 1 + amount;

		if (this.mBorderR >= 192) { this.mBorderR = 192; this.mRevBorderR = true; }
		if (this.mBorderG >= 192) { this.mBorderG = 192; this.mRevBorderG = true; }
		if (this.mBorderB >= 192) { this.mBorderB = 192; this.mRevBorderB = true; }

		if (this.mBorderR <= 64) { this.mBorderR = 64; this.mRevBorderR = false; }
		if (this.mBorderG <= 64) { this.mBorderG = 64; this.mRevBorderG = false; }
		if (this.mBorderB <= 64) { this.mBorderB = 64; this.mRevBorderB = false; }
	},

	////////////////////////////////////////////////////////////////////////////////
	/// Renders the border using the current colors.

	RenderBorder : function (context, x, y)
	{
		this.mBContext.fillStyle = 'rgb(' + this.mBorderR +
			', ' + this.mBorderG + ', ' + this.mBorderB + ')';

		this.mBContext.clearRect (0, 0, this.mCanvas.width, 180);
		this.mBContext.fillRect  (0, 0, this.mCanvas.width, 180);
		this.mBContext.globalCompositeOperation = 'destination-atop';
		this.mBorder.Render (this.mBContext, 0, 0);

		context.drawImage (this.mBuffer, x, y);
	},



	//----------------------------------------------------------------------------//
	// Game                                                                       //
	//----------------------------------------------------------------------------//

	////////////////////////////////////////////////////////////////////////////////
	/// Sets up all the games' settings and variables.

	Setup : function()
	{
		// Retrieve the canvas and context
		this.mCanvas  = document.getElementById ('game');
		this.mContext = this.mCanvas.getContext ('2d');

		// Listen for window resize events
		window.addEventListener ('resize',
			this.ResizeWindow.bind (null, this), false);

		// Do an initial resize
		this.ResizeWindow (this);

		// Load the background music
		if (!this.IsMobile())
		{
			this.mMusic = new Audio ('sounds/music.mp3');
			this.mMusic.loop = true;
			this.mMusic.autoplay = true;

			// Start the intro voice over
			this.mIntro = new Audio ('sounds/intro.mp3');
			this.mIntro.autoplay = true;
		}

		// Load main interface resources
		this.mBg    = new this.Sprite();
		this.mBorder= new this.Sprite();
		this.mLogo  = new this.Sprite();

		this.mBg    .AddFrame ('images/view/bg.jpg'    );
		this.mBorder.AddFrame ('images/view/border.png');
		this.mLogo  .AddFrame ('images/view/logo.png'  );

		this.mBuffer = document.createElement ('canvas');
		this.mBContext = this.mBuffer.getContext ('2d');
		this.mBuffer.width  = this.mCanvas.width;
		this.mBuffer.height = 180;

		// Create the player and turkey
		this.mTurkey = new this.Turkey (this);
		this.mPlayer = new this.Player (this, this.mTurkey);

		// Listen for mouse click events
		document.addEventListener ('mousedown',
			this.mPlayer.Punch.bind (null, this), false);
		document.addEventListener ('touchstart',
			this.mPlayer.Punch.bind (null, this), false);
	},

	////////////////////////////////////////////////////////////////////////////////
	/// Performs a single update on the entire game.

	Update : function (elapsed)
	{
		// Animate the border color
		this.AnimateBorder (elapsed / 30);

		// Update the player and turkey
		this.mPlayer.Update (elapsed);
		this.mTurkey.Update (elapsed);
	},

	////////////////////////////////////////////////////////////////////////////////
	/// Renders the entire game to the main canvas.

	Render : function()
	{
		// Clear the canvas screen
		this.mContext.clearRect (0, 0,
			this.mCanvas.width, this.mCanvas.height);

		// Draw the background
		this.mBg.Render (this.mContext, 0, 0);

		// Draw the turkey
		this.mTurkey.Render (this.mContext);

		// Draw the user interface
		this.mContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
		this.mContext.fillRect (0, 0, this.mCanvas.width, 160);

		this.RenderBorder (this.mContext,  20, 0);
		this.mLogo.Render (this.mContext, 490, 5);

		// Draw the player score
		this.mContext.font = 'bold 24pt Arial';
		this.mContext.fillStyle = 'rgba(200, 200, 200, 0.75)';
		this.mContext.fillText ('CURRENT SCORE', 160, 75);
		this.mContext.fillText (this.mPlayer.GetScore(), 160, 115);

		// Draw the player
		this.mPlayer.Render (this.mContext);
	},



	//----------------------------------------------------------------------------//
	// Main                                                                       //
	//----------------------------------------------------------------------------//

	////////////////////////////////////////////////////////////////////////////////
	/// Main execution point for this game.

	Start : function()
	{
		// Setup the game
		this.Setup();

		// Update the game
		this.mTimer = Date.now();
		setInterval (function (game)
		{
			// Get the current time
			var time = Date.now();

			// Update and then render the game
			game.Update (time - game.mTimer);
			game.Render ();

			// Update the timer
			game.mTimer = time;

		}.bind (null, this), 15);
	}
};

// Start the game
TurkeyGame.Start();

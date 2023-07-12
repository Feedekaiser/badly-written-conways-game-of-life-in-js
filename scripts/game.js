// lots of tight loops
// id love to use workers
// but i am not familiar with actor-style multi-threading
// would be nice if i could include gpu.js for gpgpu
const CELL_SIZE = 16;


// fact that js doesnt support operator overloading is massive disappointment
class Vector2
{
	constructor(x, y)
	{
		this.x = x || 0;
		this.y = y || 0;
	}
	add(v)
	{
		return new Vector2(this.x + v.x, this.y + v.y);
	}
	subtract(v)
	{
		return new Vector2(this.x - v.x, this.y - v.y);
	}
	multiply(s)
	{
		return new Vector2(this.x * s, this.y * s);
	}
	divide(s)
	{
		return new Vector2(this.x / s, this.y / s);
	};
    clone()
    {
        return new Vector2(this.x, this.y);
    }
}


const CANVAS = document.querySelector("#main_canvas");
const CANVAS_CTX = CANVAS.getContext("2d");




// CANVAS.width = Math.trunc(document.body.clientWidth / CELL_SIZE) * CELL_SIZE;
// CANVAS.height = Math.trunc(document.body.clientHeight / CELL_SIZE) * CELL_SIZE;


CANVAS.width = Math.trunc(window.innerWidth / CELL_SIZE) * CELL_SIZE;
CANVAS.height = Math.trunc((window.innerHeight - 60) / CELL_SIZE) * CELL_SIZE // 3 rem for the nav bar

// console.log(CANVAS_CTX); // check properties

const CANVAS_SIZE = new Vector2(CANVAS.width, CANVAS.height);

// update mouse position
let mouse = new Vector2(0, 0);
CANVAS.addEventListener("mousemove", (event) =>
{
	const rect = CANVAS.getBoundingClientRect();
	mouse.x = event.clientX - rect.left;
	mouse.y = event.clientY - rect.top;
});



// handle key presses

// keydown seems to be fired once only for the first 0.5 second of holding it down then fired once every few frames.
// If I want it the "correct" way i need to store the keys i care about and update the array on keydown and keyup.
// technically speaking i dont have to store the keys i care about and check if it exist but this is more memory efficient

const KeyState = { // I really should use typescript instead
	Up: false,
	Down: true
}

let keys = {
	q: KeyState.Up,
	a: KeyState.Up,
    e: KeyState.Up,
    r: KeyState.Up,
};

{
	const callback_factory = (value) => (event) =>
	{
		let name = event.key;
		if (keys[name] !== undefined)
			keys[name] = value;
	};

	document.addEventListener('keydown', callback_factory(KeyState.Down));
	document.addEventListener('keyup', callback_factory(KeyState.Up));
}


{

	const GRID_SIZE = (new Vector2(Math.trunc(CANVAS_SIZE.x / CELL_SIZE), Math.trunc(CANVAS_SIZE.y / CELL_SIZE))).multiply(4);
	const WORLD_SIZE = GRID_SIZE.multiply(CELL_SIZE);

	const create_grid = () =>
	{
		let grid = new Array(GRID_SIZE.y);
		for (let i = 0; i < GRID_SIZE.y; ++i)
			grid[i] = [];

		return grid;
	}

	let grid = create_grid();

	for (let y = 0; y < GRID_SIZE.y; ++y)
		for (let x = 0; x < GRID_SIZE.x; ++x)
			grid[y][x] = Math.random() > 0.5 ? 0 : 1;



	// technically i can return states instead so when neighbor is high i dont count that high and save some time but like whatever
	// caching these should make it a little faster
    // i should have flattened the array i hate js
    const GRID_SIZE_X = GRID_SIZE.x;
    const GRID_SIZE_Y = GRID_SIZE.y; 
    function count_neighbors(x, y)
	{
		let count = 0;
		for (let i = x - 1; i <= x + 1; i++)
			for (let j = y - 1; j <= y + 1; j++)
			{
				if (i === x && j === y) continue;
				count += grid[(j + GRID_SIZE_Y) % GRID_SIZE_Y][(i + GRID_SIZE_X) % GRID_SIZE_X];
			}
		return count;
	}


    let updates_per_second = 16;
	let update_interval = 1 / updates_per_second;
	let time_passed = 0;

	let zoom_speed = 0.875;
	let zoom_factor = 1;
	let offset = WORLD_SIZE.multiply(-0.5).add(CANVAS_SIZE.multiply(0.5));
	let panning_start = mouse.clone();

	let MIN_ZOOM = Math.min(CANVAS_SIZE.x / WORLD_SIZE.x, CANVAS_SIZE.x / WORLD_SIZE.y);


	// handle mouse presses
	let mouse_held = false;
	{
		document.addEventListener("mousedown", () =>
		{
			if (mouse_held === false)
				panning_start = mouse.clone();
			mouse_held = true;
		})
		document.addEventListener("mouseup", () =>
		{
			mouse_held = false
		});
	}


	function update(frametime)
	{
		//console.log(offset);

		CANVAS_CTX.clearRect(0, 0, CANVAS_SIZE.x, CANVAS_SIZE.y);

		time_passed += frametime;
		let updates_computed_this_frame = 0; // dirty fix for clicking off the page

		while (time_passed >= update_interval)
		{
			let new_grid = create_grid();
			for (let y = 0; y < GRID_SIZE.y; ++y)
				for (let x = 0; x < GRID_SIZE.x; ++x)
				{
					let neighbors = count_neighbors(x, y);
                    // please forgive me programming gods
                    new_grid[y][x] = (grid[y][x] === 1) ? ((neighbors === 2 || neighbors === 3) ? 1 : 0) : (neighbors === 3 ? 1 : 0);
                }

			grid = new_grid;
			time_passed -= update_interval;

			if (++updates_computed_this_frame > 16)
			{
				time_passed = 0;
				break;
			}
		}


        if (keys.e || keys.r)
        {
            let sign = keys.e && 1 || -1;

            // i cant just change update interval because its not linear.
            updates_per_second += (10 * frametime) * sign;
            if (updates_per_second <= 1) updates_per_second = 1;
            update_interval = 1 / updates_per_second;
        }


		if (mouse_held)
		{
			offset = offset.add(mouse.subtract(panning_start).multiply(zoom_factor));
			panning_start = mouse.clone();
		}


		let mouse_before_zoom = mouse.subtract(offset).divide(CELL_SIZE * zoom_factor);


		if (keys.q == KeyState.Down)
			zoom_factor *= 1 + (zoom_speed * frametime);
		else if (keys.a == KeyState.Down)
		{
			zoom_factor *= 1 - (zoom_speed * frametime);

			if (zoom_factor < MIN_ZOOM)
				zoom_factor = MIN_ZOOM
		}



		// totally didnt take like 4 hours to debug and figure out where i went wrong on the math part

		let new_scaled_size = CELL_SIZE * zoom_factor;
		let mouse_after_zoom = mouse_before_zoom.multiply(new_scaled_size);
		let offset_diff = mouse.subtract(offset).subtract(mouse_after_zoom);
		offset = offset.add(offset_diff);


		let offset_min = WORLD_SIZE.multiply(zoom_factor).subtract(CANVAS_SIZE).multiply(-1);
		if (offset.x > 0)
			offset.x = 0;
		if (offset.y > 0)
			offset.y = 0;
		if (offset.x < offset_min.x)
			offset.x = offset_min.x;
		if (offset.y < offset_min.y)
			offset.y = offset_min.y;

		for (let y = 0; y < GRID_SIZE.y; ++y)
			for (let x = 0; x < GRID_SIZE.x; ++x)
				if (grid[y][x])
				{
					let pos = new Vector2(x, y).multiply(new_scaled_size).add(offset);

                    // these surely are costly
					CANVAS_CTX.beginPath();
					CANVAS_CTX.rect(pos.x, pos.y, new_scaled_size, new_scaled_size);
					CANVAS_CTX.fill();
				}
	}
}




// loop
{
	let last_time = performance.now();

	window.requestAnimationFrame(loop)



	function loop()
	{
		let time_now = performance.now();
		update((time_now - last_time) * 0.001);
		last_time = time_now;
		window.requestAnimationFrame(loop);
	}
}
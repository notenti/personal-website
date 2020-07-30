import './style.css'
import './simple-grid.css'


const direction = {
    UP: 'up',
    DOWN: 'down'
}
var prev_scroll_val = window.scrollY || document.documentElement.scrollTop;
var prev_scroll_dir = direction.DOWN;
var header = document.getElementById('heading');

var checkScroll = function () {
    let cur_scroll_val = window.scrollY || document.documentElement.scrollTop;
    let dir = direction.DOWN;

    if (cur_scroll_val >= prev_scroll_val) {
        dir = direction.UP;
    }

    if (dir !== prev_scroll_dir) {
        toggleHeader(dir, cur_scroll_val);
    }
    prev_scroll_val = cur_scroll_val;
};

function toggleHeader(scroll_dir, cur_scroll_val) {
    if (scroll_dir === direction.DOWN && cur_scroll_val > 52) {
        header.classList.add('hide');
    } else {
        header.classList.remove('hide');
    }
    prev_scroll_dir = scroll_dir;
};

function toggleTextColor() {
    let cur_scroll_val = window.scrollY || document.documentElement.scrollTop;
    const page_partition = document.body.scrollHeight / 4;
    let w = document.getElementById('work-t');
    const p = document.getElementById('projects-t');
    const a = document.getElementById('about-t');
    let on_panel = Math.floor(cur_scroll_val/page_partition);

    if (on_panel % 2 === 1) {
        w.classList.add('type-light');
        p.classList.add('type-light');
        a.classList.add('type-light');
        console.log('Adding toggle');
    } else {
        w.classList.remove('type-light');
        p.classList.remove('type-light');
        a.classList.remove('type-light');
        console.log('Removing toggle');
    }
}

function loadContent() {
    const hash_less_hash = location.hash.substr(1);
    console.log(hash_less_hash);
    const element = document.getElementById(hash_less_hash.concat("-pane"));
    console.log(element)
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

if (!location.hash) {
    location.hash = "#home";
}

loadContent();
window.addEventListener("hashchange", loadContent);
window.addEventListener('scroll', checkScroll);
window.addEventListener('scroll', toggleTextColor);

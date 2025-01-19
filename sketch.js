let sources = [];
let selectedSource = null;
let isDraggingResizeHandle = false;
let autoVolumeBalance = false;
let showHelp = true;
let buttonX, buttonY, buttonWidth, buttonHeight;
let soundFiles = {};
let loadedSounds = 0;
let totalSounds = 10;

function preload() {
    // 音声ファイルのプリロード
    soundFiles = {
        'さざ波': loadSound('./assets/sazanami.mp3', soundLoaded, loadError),
        'ツクツクボウシ': loadSound('./assets/tsukutsukuboushi.mp3', soundLoaded, loadError),
        'ヒグラシ': loadSound('./assets/higurashi.mp3', soundLoaded, loadError),
        '雨音': loadSound('./assets/rain.mp3', soundLoaded, loadError),
        '川の音1': loadSound('./assets/river1.mp3', soundLoaded, loadError),
        '川の音2': loadSound('./assets/river2.mp3', soundLoaded, loadError),
        '鳥のさえずり': loadSound('./assets/birds.mp3', soundLoaded, loadError),
        '焚き火': loadSound('./assets/fire.mp3', soundLoaded, loadError),
        '川の音3': loadSound('./assets/river3.mp3', soundLoaded, loadError),
        '川の音4': loadSound('./assets/river4.mp3', soundLoaded, loadError)
    };
}

function soundLoaded() {
    loadedSounds++;
    document.getElementById('loading').innerText = 
        `Loading sounds... ${loadedSounds}/${totalSounds}`;
    
    if (loadedSounds === totalSounds) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('startButton').style.display = 'block';
    }
}

function loadError(err) {
    console.error('Sound loading error:', err);
}

function setup() {
    // キャンバスを作成し、指定したコンテナに配置
    let canvas = createCanvas(1200, 800);
    canvas.parent('sketch-container');
    
    frameRate(60);
    textSize(15);
    
    // 初期音源配置
    let radius = 300;
    let availableSounds = Object.keys(soundFiles);
    
    sources = [
        new AudioSource("音源1", -radius * cos(PI/4), 0, -radius * sin(PI/4), 0, color(100, 200, 255), availableSounds[0]),
        new AudioSource("音源2", radius * cos(PI/4), 0, -radius * sin(PI/4), 1, color(255, 100, 100), availableSounds[1]),
        new AudioSource("音源3", -radius * cos(PI/4), 0, radius * sin(PI/4), 2, color(100, 255, 100), availableSounds[2]),
        new AudioSource("音源4", radius * cos(PI/4), 0, radius * sin(PI/4), 3, color(255, 200, 0), availableSounds[3])
    ];

    // ボタン設定
    buttonWidth = 180;
    buttonHeight = 30;
    buttonX = width - buttonWidth - 20;
    buttonY = height - buttonHeight - 20;
}

function draw() {
    background(0);
    
    push();
    translate(width/2, height/2);
    
    drawGrid();
    sources.forEach(source => source.display());
    
    pop();
    
    drawUI();
}

function drawGrid() {
    const innerRadius = 100;
    const outerRadius = 400;
    const gridLines = 8;
    
    // 円形グリッド線
    for (let i = 0; i <= gridLines; i++) {
        const radius = lerp(innerRadius, outerRadius, i / gridLines);
        const alpha = map(i, 0, gridLines, 100, 20);
        stroke(40, alpha);
        strokeWeight(1);
        noFill();
        ellipse(0, 0, radius * 2, radius * 2);
    }
    
    // 放射状の線
    const radialLines = 12;
    for (let i = 0; i < radialLines; i++) {
        const angle = map(i, 0, radialLines, 0, TWO_PI);
        const alpha = 30;
        stroke(40, alpha);
        strokeWeight(1);
        
        const x1 = cos(angle) * innerRadius;
        const y1 = sin(angle) * innerRadius;
        const x2 = cos(angle) * outerRadius;
        const y2 = sin(angle) * outerRadius;
        
        line(x1, y1, x2, y2);
    }
    
    // 中心点
    noStroke();
    fill(255, 255, 0, 100);
    ellipse(0, 0, 20, 20);
    stroke(255, 255, 0);
    strokeWeight(2);
    ellipse(0, 0, 30, 30);
    
    // 距離マーカー
    fill(150);
    textAlign(CENTER, CENTER);
    textSize(12);
    
    for (let i = 1; i <= gridLines; i++) {
        const radius = lerp(innerRadius, outerRadius, i / gridLines);
        const value = round(map(radius, innerRadius, outerRadius, 100, 400));
        const angle = PI / 4;
        const x = cos(angle) * radius;
        const y = sin(angle) * radius;
        text(str(value), x, y);
    }
}

function drawUI() {
    if (showHelp) {
        drawHelp();
    }
    
    if (selectedSource) {
        drawSelectedSourceInfo();
    }
    
    drawVolumeControls();
}

function drawHelp() {
    fill(0, 200);
    noStroke();
    rect(10, 10, 250, 180);
    fill(255);
    textAlign(LEFT, TOP);
    textSize(14);
    text(
        "操作方法:\n" +
        "・ドラッグ: 音源の移動\n" +
        "・円の端の黄色いハンドル: 音量調整\n" +
        "・H: ヘルプ表示切替\n" +
        "・S: 配置を保存\n" +
        "・L: 配置を読込\n" +
        "・音源名をクリック: 音源切替\n\n" +
        "中心点が聞き手の位置です",
        20, 20
    );
}

function drawSelectedSourceInfo() {
    fill(0, 200);
    noStroke();
    rect(10, height - 60, 300, 50);
    fill(255);
    textAlign(LEFT, BOTTOM);
    textSize(14);
    text(
        `選択中: ${selectedSource.name}\n` +
        `位置: X=${nf(selectedSource.position.x, 0, 1)}, ` +
        `Y=${nf(selectedSource.position.z, 0, 1)} / ` +
        `音量: ${nf(selectedSource.visualVolume, 0, 2)}`,
        20, height - 10
    );
}

function drawVolumeControls() {
    const isHovered = mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
                     mouseY >= buttonY && mouseY <= buttonY + buttonHeight;
    
    fill(autoVolumeBalance ? 
         (isHovered ? color(100, 200, 100, 220) : color(100, 200, 100, 180)) :
         (isHovered ? color(80, 80, 80, 220) : color(60, 60, 60, 180)));
    
    stroke(autoVolumeBalance ? color(120, 255, 120) : color(100, 100, 100));
    strokeWeight(2);
    rect(buttonX, buttonY, buttonWidth, buttonHeight, 15);
    
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text(
        autoVolumeBalance ? "自動音量調整: ON" : "自動音量調整: OFF",
        buttonX + buttonWidth/2, 
        buttonY + buttonHeight/2
    );
}

class AudioSource {
    constructor(name, x, y, z, index, sourceColor, initialSound) {
        this.position = createVector(x, y, z);
        this.name = name;
        this.radius = 30;
        this.visualVolume = 1.0;
        this.baseVolume = 1.0;
        this.isDragging = false;
        this.isResizing = false;
        this.index = index;
        this.sourceColor = sourceColor;
        this.soundName = initialSound;
    }

    display() {
        push();
        translate(this.position.x, this.position.z);
        
        this.drawShadow();
        this.drawInfluenceRange();
        this.drawMainCircle();
        this.drawLabels();
        this.drawVolumeHandle();
        
        pop();
        
        this.drawSoundSelector();
        this.updateAudio();
    }

    drawShadow() {
        noStroke();
        fill(0, 100);
        const displayRadius = this.radius * (0.5 + this.visualVolume);
        ellipse(5, 5, displayRadius * 2.2, displayRadius * 2.2);
    }

    drawInfluenceRange() {
        const influenceRadius = this.radius * 3 * this.visualVolume;
        noFill();
        strokeWeight(1);
        for (let i = 0; i < 3; i++) {
            stroke(red(this.sourceColor), green(this.sourceColor), blue(this.sourceColor), 20);
            const currentRadius = influenceRadius * (1 - i/4.0);
            ellipse(0, 0, currentRadius * 2, currentRadius * 2);
        }
    }

    drawMainCircle() {
        const currentRadius = this.radius * (0.5 + this.visualVolume);
        noStroke();
        fill(this.sourceColor, this.isDragging ? 200 : 150);
        ellipse(0, 0, currentRadius * 2, currentRadius * 2);
    }

    drawLabels() {
        const currentRadius = this.radius * (0.5 + this.visualVolume);
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(14);
        text(this.soundName, 0, -currentRadius - 25);
        textSize(12);
        text("Vol: " + nf(this.visualVolume, 0, 2), 0, -currentRadius - 10);
    }

    drawVolumeHandle() {
        if (this.isDragging || this.isResizing) {
            const currentRadius = this.radius * (0.5 + this.visualVolume);
            stroke(255, 255, 0);
            strokeWeight(2);
            line(0, 0, currentRadius, 0);
            fill(255, 255, 0);
            noStroke();
            ellipse(currentRadius, 0, 12, 12);
        }
    }

    drawSoundSelector() {
        const selectorWidth = 200;
        const selectorHeight = 40;
        const outerRadius = 400;
        const lineLength = 50;
        
        // 各音源
        // drawSoundSelector続き
        const angles = [30, 150, 210, 330];
        const angle = radians(angles[this.index]);
        
        push();
        resetMatrix();
        translate(width/2, height/2);
        
        // セレクターの位置を計算
        const anchorX = cos(angle) * (outerRadius + lineLength/2);
        const anchorY = sin(angle) * (outerRadius + lineLength/2);
        
        // セレクターを角度に合わせて回転
        push();
        translate(anchorX, anchorY);
        rotate(angle);
        
        // セレクターの背景を描画
        fill(40, 40, 40, 240);
        stroke(this.sourceColor);
        strokeWeight(2);
        rect(-selectorWidth/2, -selectorHeight/2, selectorWidth, selectorHeight, 10);
        
        // セレクターのテキストを描画
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(14);
        // テキストを回転を考慮して描画
        push();
        if (angle > PI/2 && angle < 3*PI/2) {
            rotate(PI);
            text(this.soundName, 0, 0);
        } else {
            text(this.soundName, 0, 0);
        }
        pop();
        pop();
        
        // 円からセレクターまでの接続線を描画
        stroke(this.sourceColor);
        strokeWeight(1);
        const circleX = cos(angle) * outerRadius;
        const circleY = sin(angle) * outerRadius;
        line(circleX, circleY, anchorX, anchorY);
        
        pop();
    }

    updateAudio() {
        if (!soundFiles[this.soundName]) return;

        const distance = this.position.mag();
        const maxDistance = 400;
        
        // 指数関数的な距離減衰
        const distanceAttenuation = exp(-distance / (maxDistance / 2));
        
        // 音量の計算
        const manualVolume = this.visualVolume;
        const autoAdjustmentFactor = autoVolumeBalance ? this.baseVolume : 1.0;
        
        let finalVolume = distanceAttenuation * manualVolume * autoAdjustmentFactor;
        finalVolume = constrain(finalVolume, 0.0001, 1);
        
        // パンの計算
        const pan = constrain(map(this.position.x, -400, 400, -1, 1), -1, 1);
        
        soundFiles[this.soundName].setVolume(finalVolume);
        soundFiles[this.soundName].pan(pan);
    }

    checkSoundSelection(mx, my) {
        const selectorWidth = 200;
        const selectorHeight = 40;
        const outerRadius = 400;
        const lineLength = 50;
        const angles = [30, 150, 210, 330];
        const angle = radians(angles[this.index]);
        
        // セレクターの中心位置を計算
        const anchorX = cos(angle) * (outerRadius + lineLength/2);
        const anchorY = sin(angle) * (outerRadius + lineLength/2);
        
        // クリック位置を回転させた座標系で計算
        const rotatedX = (mx * cos(-angle)) - (my * sin(-angle));
        const rotatedY = (mx * sin(-angle)) + (my * cos(-angle));
        
        // セレクターの中心を基準とした相対座標に変換
        const relX = rotatedX - anchorX * cos(-angle) + anchorY * sin(-angle);
        const relY = rotatedY - anchorX * sin(-angle) - anchorY * cos(-angle);
        
        // セレクターの範囲内かチェック
        return (abs(relX) < selectorWidth/2 && abs(relY) < selectorHeight/2);
    }

    cycleThroughSounds() {
        const availableSounds = Object.keys(soundFiles);
        const currentIndex = availableSounds.indexOf(this.soundName);
        const nextIndex = (currentIndex + 1) % availableSounds.length;
        
        // 現在の音声をフェードアウト
        if (soundFiles[this.soundName]) {
            soundFiles[this.soundName].setVolume(0, 0.1);
        }
        
        // 新しい音声を設定
        this.soundName = availableSounds[nextIndex];
        
        // 新しい音声を再生
        if (soundFiles[this.soundName]) {
            if (!soundFiles[this.soundName].isLooping()) {
                soundFiles[this.soundName].loop();
            }
        }
    }
}

// DOMが読み込まれた後に実行
document.addEventListener('DOMContentLoaded', function() {
    // 最初はスタートボタンを非表示
    document.getElementById('startButton').style.display = 'none';
    
    // スタートボタンのイベントリスナー
    document.getElementById('startButton').addEventListener('click', async function() {
        try {
            // オーディオコンテキストの開始
            await getAudioContext().resume();
            
            // 各音源の再生開始
            for (const [name, sound] of Object.entries(soundFiles)) {
                console.log(`Starting playback for ${name}`);
                if (sound && sound.isLoaded()) {
                    sound.loop();
                    sound.setVolume(0);
                } else {
                    console.error(`Sound ${name} not loaded properly`);
                }
            }
            
            // スタートボタンを非表示
            this.classList.add('hidden');
            
        } catch (error) {
            console.error('Error starting audio:', error);
        }
    });
});

function mousePressed() {
    // 自動音量調整ボタンのクリック検出
    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
        autoVolumeBalance = !autoVolumeBalance;
        if (!autoVolumeBalance) {
            sources.forEach(source => {
                source.baseVolume = source.visualVolume;
            });
        }
        return;
    }

    // マウス座標を画面中心原点の座標系に変換
    const mx = mouseX - width/2;
    const my = mouseY - height/2;

    // 音源セレクターのチェック
    for (const source of sources) {
        if (source.checkSoundSelection(mx, my)) {
            source.cycleThroughSounds();
            return;
        }
    }

    selectedSource = null;
    isDraggingResizeHandle = false;

    // 音源の選択と操作
    for (let i = sources.length - 1; i >= 0; i--) {
        const source = sources[i];
        const currentRadius = source.radius * (0.5 + source.visualVolume);
        const handleX = source.position.x + currentRadius;
        const handleY = source.position.z;
        
        const d = dist(mx, my, source.position.x, source.position.z);
        const handleD = dist(mx, my, handleX, handleY);

        if (handleD < 15) {
            selectedSource = source;
            isDraggingResizeHandle = true;
            source.isResizing = true;
            break;
        } else if (d < currentRadius) {
            selectedSource = source;
            source.isDragging = true;
            break;
        }
    }
}

function mouseDragged() {
    if (selectedSource) {
        const mx = mouseX - width/2;
        const my = mouseY - height/2;

        if (isDraggingResizeHandle) {
            // 音量調整
            const dx = mx - selectedSource.position.x;
            const dy = my - selectedSource.position.z;
            const newSize = sqrt(dx*dx + dy*dy) / selectedSource.radius - 0.5;
            selectedSource.visualVolume = constrain(newSize, 0.1, 2.0);
            if (!autoVolumeBalance) {
                selectedSource.baseVolume = selectedSource.visualVolume;
            }
        } else {
            // 位置の移動
            const newPos = createVector(mx, my);
            const distance = newPos.mag();
            
            // ドーナツの内径と外径
            const innerRadius = 100;
            const outerRadius = 400;
            
            if (distance > innerRadius && distance <= outerRadius) {
                selectedSource.position.x = newPos.x;
                selectedSource.position.z = newPos.y;
            } else if (distance <= innerRadius) {
                // 内側の境界に制限
                newPos.normalize().mult(innerRadius);
                selectedSource.position.x = newPos.x;
                selectedSource.position.z = newPos.y;
            } else {
                // 外側の境界に制限
                newPos.normalize().mult(outerRadius);
                selectedSource.position.x = newPos.x;
                selectedSource.position.z = newPos.y;
            }
        }
    }
}

function mouseReleased() {
    if (selectedSource) {
        selectedSource.isDragging = false;
        selectedSource.isResizing = false;
        selectedSource = null;
    }
    isDraggingResizeHandle = false;
}

function keyPressed() {
    if (key === 'h' || key === 'H') {
        showHelp = !showHelp;
    } else if (key === 's' || key === 'S') {
        saveConfiguration();
    } else if (key === 'l' || key === 'L') {
        loadConfiguration();
    }
}

function saveConfiguration() {
    const config = sources.map(source => ({
        name: source.name,
        x: source.position.x,
        y: source.position.y,
        z: source.position.z,
        visualVolume: source.visualVolume,
        baseVolume: source.baseVolume,
        soundName: source.soundName
    }));
    
    localStorage.setItem('audioConfig', JSON.stringify(config));
    console.log("Configuration saved");
}

function loadConfiguration() {
    try {
        const config = JSON.parse(localStorage.getItem('audioConfig'));
        if (config) {
            config.forEach(sourceConfig => {
                const source = sources.find(s => s.name === sourceConfig.name);
                if (source) {
                    source.position.x = sourceConfig.x;
                    source.position.y = sourceConfig.y;
                    source.position.z = sourceConfig.z;
                    source.visualVolume = sourceConfig.visualVolume;
                    source.baseVolume = sourceConfig.baseVolume;
                    source.soundName = sourceConfig.soundName;
                }
            });
            console.log("Configuration loaded");
        }
    } catch (e) {
        console.log("No saved configuration found");
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    buttonX = width - buttonWidth - 20;
    buttonY = height - buttonHeight - 20;
}

function touchStarted() {
    // モバイルデバイス用のタッチイベント処理
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}
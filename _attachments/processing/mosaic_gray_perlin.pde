int cv_width = 600;
int cv_height = 480;

int granularity = 12;
float noise_increment = 0.065;
int cols = cv_width/granularity;
int rows = cv_height/granularity;
int max_tile_width = 5;
int max_tile_height = 5;
boolean[][] grid = new boolean[cols][rows];

void setup() {
  size(cv_width, cv_height);
  background(#ffffff);
  noStroke();
  smooth();
  initGrid();
  drawTiles(int((width*2/3)/granularity), int((height*2/3)/granularity));
}

void drawTiles(int x, int y) {
  
  for (int i = 0; i < cols; i++) { 
    int ii = i + x >= cols ? (i + x) - cols : i + x;
    for (int j = 0; j < rows; j++) { 
      int jj = j + y >= rows ? (j + y) - rows : j + y;
      if (!gridFilled()) {
        if (!grid[ii][jj]) {
          Tile t = (Tile) getPossibleTile(ii, jj);
          t.display(ii, jj, granularity);
          markGrid(ii, jj, t.width(), t.height());
          //printGrid();
        }
      }    
    }
  }   
   
}

void initGrid() {
  for (int i = 0; i < cols; i++) {
    for (int j = 0; j < rows; j++) {
      grid[i][j] = false;
    }
  }
}

void markGrid(int x, int y, int w, int h) {
  for (int i = 0; i < w; i++) { 
    for (int j = 0; j < h; j++) {  
      grid[i + x][j + y] = true; 
    }
  }
}

// Utility
void printGrid() {
  for (int j = 0; j < rows; j++) { 
  
    String s = "";
      for (int i = 0; i < cols; i++) { 
      
      if(grid[i][j]) {
        s = s + " x";
      } else {
        s = s + " o";
      }
      
    }
    println(s);
  } 
  println("");
}

boolean gridFilled() {
  for (int i = 0; i < cols; i++) { 
    for (int j = 0; j < rows; j++) { 
      if (!grid[i][j]) { 
        return false;
      } 
    }
  }
  return true;
}

Tile getPossibleTile(int x, int y) {
  
  TileCollection possible_tiles = new TileCollection();
  
  // A 1x1 tile is always possible
  possible_tiles.addTile(1, 1);
  
  // Get possible tiles across
  int my = maxY(x, y);
  for (int i = 0; i < maxX(x, y); i++) { 
    my = (maxY(x + i, y) > my) ? my : maxY(x + i, y);
    for (int j = 1; j < my; j++) { 
      possible_tiles.addTile(i + 1, j + 1);
    }
  }
  
  // Get possible tiles down
  int mx = maxX(x, y);
  for (int j = 0; j < maxY(x, y); j++) { 
    mx = (maxX(x, y + j) > mx) ? mx : maxX(x, y + j);
    for (int i = 1; i < mx; i++) { 
      possible_tiles.addTile(i + 1, j + 1);
    }
  }
  
  possible_tiles.cleanUp();
  
  //for (int i = 0; i < possible_tiles.size(); i++) { 
  //  Tile t = (Tile) possible_tiles.get(i);
  //  println(t.inspect());
  //}
  
  return possible_tiles.randomTile();
}

// How many cols to the left can we take up before runnning
// into the edge or a taken grid spot?
int maxX(int col, int row) {
  for (int i = 1; i < (cols - col); i++) { 
    if (grid[col + i][row]) { return i; }
    if (i >= max_tile_width) { return i; }
  }
  return (cols - col);
}

// How many rows down can we take up before runnning
// into the edge or a taken grid spot?
int maxY(int col, int row) {
  for (int j = 1; j < (rows - row); j++) { 
    if (grid[col][row + j]) { return j; }
    if (j >= max_tile_height) { return j; }
  }
  return (rows - row);
}





class Tile {
  
  int w, h;
  
  Tile(int wd, int ht) {  
    w = wd;
    h = ht; 
  }
  
  int width() { return w; }
  int height() { return h; }
  
  String inspect() { 
    return "w: " + w + " h: " + h;
  }
  
  void getColor(float x, float y) {
    float density = noise(x*noise_increment, y*noise_increment);
    color c = lerpColor(color(#ffffff), color(#000000), density);  
    noStroke();
    fill(c);
  }
  
  
  void display(int x, int y, int g) {
    
    int rand_max = granularity * 1/7; 
    getColor(x + w/2, y + h/2);

    beginShape();
    float first_x = x*g - random(rand_max);
    float first_y = y*g - random(rand_max);
    vertex(first_x, first_y);  
    vertex(x*g - random(rand_max), y*g + h*g + random(rand_max));
    vertex(x*g + w*g + random(rand_max), y*g + h*g + random(rand_max));  
    vertex(x*g + w*g + random(rand_max), y*g - random(rand_max));  
    vertex(first_x, first_y);
    endShape();
    //println("x: " + x + " y: " + y + " w: " + w + " h: " + h);
  } 
}

class TileCollection {
  
  ArrayList tiles = new ArrayList();
  
  TileCollection() {
    ArrayList tiles = new ArrayList();
  }
  
  void addTile(int w, int h) {
    tiles.add(new Tile(w, h));
  }
  
  ArrayList tiles() {
    return tiles;
  }
  
  int size() {
    return tiles.size(); 
  }
  
  Tile get(int k) { 
    Tile t = (Tile) tiles.get(k);
    return t;
  }
  
  void cleanDuplicates() {
    ArrayList tile_strings = new ArrayList();
    for (int i = tiles.size()-1; i >= 0; i--) { 
      Tile t = (Tile) tiles.get(i);
      if (isDuplicateTile(t)) {
         tiles.remove(i);
      }
    }
  }
  
  void cleanZeroEdges() {
    ArrayList tile_strings = new ArrayList();
    for (int i = tiles.size()-1; i >= 0; i--) { 
      Tile t = (Tile) tiles.get(i);
      if ((t.width() == 0) || (t.height() == 0)) {
        tiles.remove(i);
      }
    }
  }
  
  void cleanUp() {
    cleanZeroEdges();
    cleanDuplicates(); 
  }
  
  boolean isDuplicateTile(Tile t) {
    int ct = 0;
    for (int i = 0; i < tiles.size(); i++) { 
      Tile tt = (Tile) tiles.get(i);
      if ( (tt.width() == t.width()) && (tt.height() == t.height())) { 
        ct++; 
      }
    }
    if (ct >= 2) {
      return true;
    } else {
      return false; 
    }
  }
  
  Tile randomTile() {
    int i = int(random(tiles.size()));
    Tile t = (Tile) tiles.get(i);  
    return t;
  }
}
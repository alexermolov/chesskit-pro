// Тестовый PGN с вариациями для проверки парсера
export const TEST_PGN_WITH_VARIATIONS =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 (3. Bc4 Be7 4. d3) 3... a6 4. Ba4 Nf6 5. O-O Be7 (5... b5 6. Bb3 Bb7) 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 *";

export const SIMPLE_PGN =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *";

// Дополнительные тестовые PGN для проверки различных случаев
export const COMPLEX_PGN_WITH_MULTIPLE_VARIATIONS =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 (3. Bc4 Be7 (3... f5 4. exf5 Bxf5) 4. d3) 3... a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 *";

export const PGN_WITH_NESTED_VARIATIONS =
  "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 (3... Nf6 4. O-O (4. d3 Be7) 4... Be7) 4. Ba4 *";

// Сложный PGN с глубокими вариациями и комментариями для тестирования
export const COMPLEX_QUEEN_GAMBIT_PGN = `1.d4 d5 2.c4 c6 3.cxd5 cxd5 4.Nc3 
    ( 4.Bg5 { [%draw arrow,g5,d8,green]} 4...Qb6 { [%draw 
    arrow,b6,b2,green]} 
        ( 4...Nc6 5.Nc3 Qb6 
            ( 5...Nf6 6.Bxf6 exf6 { [%draw full,d5,green]} 
                ( 6...gxf6 7.e3 e6 8.Bd3 Bd6 9.Nf3 f5 10.g3 Bd7 11.O-O Rc8
                12.Rc1 h5 
                    ( 12...O-O { [%draw arrow,b2,b4,green] [%draw 
                    arrow,d1,e2,green]} )
                )
            7.e3 Bb4 8.Ne2 O-O 9.Rc1 { [%draw arrow,e2,f4,green] [%draw 
            arrow,f4,d5,green]} 9...Be6 10.Nf4 Rc8 { [%draw 
            arrow,a2,a3,green] [%draw arrow,d1,f3,green]} 11.Bd3 { [%draw 
            arrow,a2,a3,green] [%draw arrow,d1,f3,green] [%draw 
            arrow,e1,g1,green]} )
        6.Nxd5 
            ( 6.e4 dxe4 
                ( 6...e6 7.exd5 exd5 8.Bb5 a6 
                    ( 8...Bb4 9.Qa4 )
                    ( 8...Be6 )
                9.Nxd5 Qxb5 10.Nc7+ { [%draw arrow,c7,b5,green] [%draw 
                arrow,c7,e8,green] [%draw arrow,c7,a8,green]} )
            7.d5 Nb4 
                ( 7...Ne5 8.Be3 Qxb2 9.Nb5 { [%draw arrow,b5,c7,green] 
                [%draw arrow,e3,d4,green]} )
            8.Bb5+ Bd7 9.Bxd7+ Kxd7 10.Nxe4 )
        6...Qa5+ {ОШИБКА!} )
        ( 4...h6 5.Bh4 g5 
            ( 5...Qb6 6.Nc3 Qxb2 
                ( 6...e6 { [%draw full,c8,green]} 7.Qd2 )
            7.Nxd5 e6 8.Rb1 { [%draw arrow,b1,b4,green]} 8...Qxa2 )
        6.Bg3 )
    5.Nc3 Qxb2 
        ( 5...e6 { [%draw full,c8,green]} 6.Qd2 { [%draw 
        arrow,d2,b2,green] [%draw arrow,e2,e3,green] [%draw 
        arrow,f1,d3,green] [%draw arrow,g1,f3,green] [%draw 
        arrow,e1,g1,green]} )
    6.Nxd5 { [%draw arrow,d5,c7,green]} 6...Na6 { [%draw 
    arrow,a6,c7,green]} 7.e4 { [%draw arrow,f1,a6,green]} 7...e6 8.Rb1 
    Qxa2 9.Bb5+ Bd7 10.Ra1 
        ( 10.Bxd7+ Kxd7 11.Rxb7+ Kc8 12.Rxf7 )
    10...Qb2 11.Bxd7+ Kxd7 12.Qa4+ )
4...Nc6 5.Bg5 f6 
    ( 5...h6 6.Bh4 Qb6 )
6.Bh4 
    ( 6.Bd2 Nxd4 7.e3 Nc6 
        ( 7...Nf5 8.Bd3 e5 9.Nge2 { [%draw arrow,d1,b3,green] [%draw 
        arrow,a1,c1,green]} )
    8.Qh5+ g6 9.Qxd5 Qxd5 10.Nxd5 { [%draw full,e7,green] [%draw 
    full,f6,green] [%draw full,g6,green]} )
6...Nh6 
    { [%draw arrow,h6,f5,green] [%draw full,h4,green]}
*`;
